import {
  AuthResult,
  TelegramConfirmOptions,
  TelegramSignInResult,
  TgSignInOptions,
} from '../models/auth.models'
import { ApiClient } from '../../adapters/api/api-client.interface'
import { LoggerService } from '../../logging/logger.service'
import { AuthLoggerService } from '../../logging/services/auth-logger.service'
import { LogCategory } from '../../logging/models/log-category.enum'
import { LogLevel } from '../../logging/models/log-level.enum'
import { TelegramAuthConfig } from '../../config/auth-config'
import {
  TelegramAuthAdapter,
  TelegramUserData,
} from '../../adapters/telegram/telegram-auth.adapter'

export interface TelegramAuthService {
  initSignIn(options: TgSignInOptions): Promise<TelegramSignInResult>
  handleAuthResult(data: Record<string, unknown>): Promise<AuthResult>
  validateTelegramData(data: Record<string, unknown>): boolean
  initialize(): Promise<void>
  createLoginWidget(elementId: string, options?: { size?: 'large' | 'medium' | 'small' }): void
  authenticateWithWidget(): Promise<AuthResult>
  confirmAuth(options: TelegramConfirmOptions): Promise<AuthResult>
}

export class TelegramAuth implements TelegramAuthService {
  private readonly adapter: TelegramAuthAdapter
  private readonly apiClient: ApiClient
  private readonly logger: LoggerService
  private readonly authLogger: AuthLoggerService
  private readonly config: TelegramAuthConfig

  constructor(
    adapter: TelegramAuthAdapter,
    apiClient: ApiClient,
    logger: LoggerService,
    config: TelegramAuthConfig,
  ) {
    this.adapter = adapter
    this.apiClient = apiClient
    this.logger = logger
    this.config = config
    this.authLogger = new AuthLoggerService(logger)
  }

  async initSignIn(options: TgSignInOptions): Promise<TelegramSignInResult> {
    const correlationId = `telegram-init-${Date.now()}`
    try {
      this.logger.debug('Initializing Telegram sign in', {
        details: {
          botName: options.botName,
          redirectUrl: options.redirectUrl,
          hasOrigin: !!options.origin,
          isBinding: !!options.isBinding,
          correlationId,
        },
      })

      const baseUrl = 'https://oauth.telegram.org/auth'
      const queryParams = new URLSearchParams()

      const botId = options.botName || this.config.botId
      queryParams.append('bot_id', botId)

      const redirectUrl = options.redirectUrl || this.config.redirectUrl
      if (redirectUrl) {
        queryParams.append('redirect_url', redirectUrl)
      }

      if (options.origin) {
        queryParams.append('origin', options.origin)
      }

      const requestAccess = options.requestAccess || this.config.requestAccess
      if (requestAccess && requestAccess.length > 0) {
        queryParams.append('request_access', requestAccess.join(','))
      }

      if (options.isBinding) {
        queryParams.append('binding_mode', 'true')
      }

      const authUrl = `${baseUrl}?${queryParams.toString()}`
      this.logger.debug('Generated Telegram auth URL', {
        details: { authUrl, correlationId },
      })

      // Добавляем запись в лог о начале процесса аутентификации
      this.logger.info('Telegram authentication initiated', {
        category: LogCategory.AUTH,
        action: 'telegram_auth_init',
        success: true,
        details: {
          botId,
          redirectUrl,
          hasOrigin: !!options.origin,
          isBinding: !!options.isBinding,
          correlationId,
        },
      })

      try {
        const response = await this.apiClient.post<TelegramSignInResult>('/auth/telegram/init', {
          botId,
          redirectUrl,
          origin: options.origin,
          isBinding: options.isBinding,
        })

        this.logger.debug('Telegram auth initialization successful', {
          details: {
            id: response.id,
            hasCode: !!response.code,
            hasQr: !!response.qr,
            correlationId,
          },
        })

        return {
          url: authUrl,
          id: response.id,
          code: response.code,
          qr: response.qr,
          linkToBot: response.linkToBot,
        }
      } catch (error) {
        this.logger.error('Error during Telegram auth initialization API request', error)
        this.authLogger.logTelegramAuth(false, {
          error: 'API initialization request failed',
          correlationId,
        })
        return { url: authUrl }
      }
    } catch (error) {
      this.logger.error('Error initializing Telegram sign in', error)
      this.logger.error('Failed to initialize Telegram sign in', error, {
        category: LogCategory.AUTH,
        action: 'telegram_auth_init',
        success: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          correlationId,
        },
      })
      throw error
    }
  }

  async handleAuthResult(data: Record<string, unknown>): Promise<AuthResult> {
    try {
      this.logger.debug('Handling Telegram auth result', {
        details: { dataPresent: !!data },
      })

      if (!this.validateTelegramData(data)) {
        const error = new Error('Invalid Telegram auth data')
        this.logger.error('Telegram auth validation failed', error)
        this.authLogger.logTelegramAuth(false, { error: 'Invalid auth data' })
        return {
          isSuccess: false,
          error,
        }
      }

      const userData: TelegramUserData = {
        id: typeof data.id === 'number' ? data.id : Number(data.id),
        firstName:
          typeof data.first_name === 'string' ? data.first_name : String(data.first_name || ''),
        lastName:
          typeof data.last_name === 'string'
            ? data.last_name
            : data.last_name
              ? String(data.last_name)
              : undefined,
        username:
          typeof data.username === 'string'
            ? data.username
            : data.username
              ? String(data.username)
              : undefined,
        photoUrl:
          typeof data.photo_url === 'string'
            ? data.photo_url
            : data.photo_url
              ? String(data.photo_url)
              : undefined,
        authDate: typeof data.auth_date === 'number' ? data.auth_date : Number(data.auth_date),
        hash: typeof data.hash === 'string' ? data.hash : String(data.hash || ''),
      }

      try {
        const response = await this.apiClient.post<AuthResult>('/auth/telegram', userData)

        this.logger.debug('Telegram auth successful', {
          details: { userId: userData.id },
        })
        this.authLogger.logTelegramAuth(true, {
          userId: String(userData.id),
          username: userData.username,
          correlationId: `telegram-auth-${userData.id}-${Date.now()}`,
        })

        return response
      } catch (error) {
        this.logger.error('Error during Telegram auth API request', error)
        this.authLogger.logTelegramAuth(false, {
          error: 'API request failed',
          userId: String(userData.id),
          correlationId: `telegram-auth-${userData.id}-${Date.now()}`,
        })
        return {
          isSuccess: false,
          error: error instanceof Error ? error : new Error('Unknown error during Telegram auth'),
        }
      }
    } catch (error) {
      this.logger.error('Error handling Telegram auth result', error)
      this.authLogger.logTelegramAuth(false, { error: 'Unexpected error' })
      return {
        isSuccess: false,
        error: error instanceof Error ? error : new Error('Unknown error during Telegram auth'),
      }
    }
  }
  validateTelegramData(data: Record<string, unknown>): boolean {
    try {
      if (!data.id || !data.first_name || !data.auth_date || !data.hash) {
        this.logger.warn('Missing required fields in Telegram auth data')
        this.authLogger.logSuspiciousActivity('Missing required fields in Telegram auth data', {
          type: 'telegram_auth_validation',
          reason: 'missing_required_fields',
          id: !!data.id,
          firstName: !!data.first_name,
          authDate: data.auth_date ? 1 : 0, // Преобразуем в число для совместимости с типом
          hash: !!data.hash,
        })
        return false
      }

      const authDate = Number(data.auth_date) * 1000
      const now = Date.now()
      if (now - authDate > 86400000) {
        this.logger.warn('Telegram auth data is too old')
        this.authLogger.logSuspiciousActivity('Telegram auth data is too old', {
          type: 'telegram_auth_validation',
          reason: 'expired_auth_data',
          authDate,
          now,
          diff: now - authDate,
        })
        return false
      }

      // Проверка хеша должна выполняться на сервере,  для этого нужен секретный ключ бота
      // Здесь мы просто проверяем наличие хеша

      return true
    } catch (error) {
      this.logger.error('Error validating Telegram auth data', error)
      this.authLogger.logSuspiciousActivity('Error validating Telegram auth data', {
        type: 'telegram_auth_validation',
        reason: 'validation_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return false
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.adapter.initialize()
      this.logger.debug('Telegram auth service initialized')
      this.logger.info('Telegram auth service initialized', {
        category: LogCategory.SYSTEM,
        action: 'telegram_auth_init',
        success: true,
      })
    } catch (error) {
      this.logger.error('Error initializing Telegram auth service', error)
      this.logger.error('Failed to initialize Telegram auth service', error, {
        category: LogCategory.SYSTEM,
        action: 'telegram_auth_init',
        success: false,
        level: LogLevel.CRITICAL,
      })
      throw error
    }
  }

  createLoginWidget(
    elementId: string,
    options: { size?: 'large' | 'medium' | 'small' } = {},
  ): void {
    try {
      this.logger.debug('Creating Telegram login widget', {
        details: { elementId, size: options.size },
      })
      this.adapter.createLoginWidget(elementId, options)
      this.logger.info('Telegram login widget created', {
        category: LogCategory.AUTH,
        action: 'create_telegram_widget',
        success: true,
        details: { elementId, size: options.size },
      })
    } catch (error) {
      this.logger.error('Error creating Telegram login widget', error)
      this.logger.error('Failed to create Telegram login widget', error, {
        category: LogCategory.AUTH,
        action: 'create_telegram_widget',
        success: false,
        details: { elementId, size: options.size },
      })
      throw error
    }
  }

  async authenticateWithWidget(): Promise<AuthResult> {
    const correlationId = `telegram-widget-auth-${Date.now()}`
    try {
      this.logger.debug('Starting Telegram widget authentication', { correlationId })
      const result = await this.adapter.authenticate()

      if (!result.isSuccess || !result.userData) {
        this.authLogger.logTelegramAuth(false, {
          error: result.error?.message || 'Widget authentication failed',
          correlationId,
        })
        return {
          isSuccess: false,
          error: result.error || new Error('Telegram authentication failed'),
        }
      }

      try {
        const response = await this.apiClient.post<AuthResult>('/auth/telegram', result.userData)

        this.logger.debug('Telegram auth with widget successful', {
          details: { userId: result.userData.id },
        })
        this.authLogger.logTelegramAuth(true, {
          userId: String(result.userData.id),
          username: result.userData.username,
          method: 'widget',
          correlationId,
        })

        return response
      } catch (error) {
        this.logger.error('Error during Telegram auth API request', error)
        this.authLogger.logTelegramAuth(false, {
          error: 'API request failed',
          userId: String(result.userData.id),
          method: 'widget',
          correlationId,
        })
        return {
          isSuccess: false,
          error: error instanceof Error ? error : new Error('Unknown error during Telegram auth'),
        }
      }
    } catch (error) {
      this.logger.error('Error during Telegram widget authentication', error)
      this.authLogger.logTelegramAuth(false, {
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'widget',
        correlationId,
      })
      return {
        isSuccess: false,
        error: error instanceof Error ? error : new Error('Unknown error during Telegram auth'),
      }
    }
  }

  async confirmAuth(options: TelegramConfirmOptions): Promise<AuthResult> {
    const correlationId = `telegram-confirm-${Date.now()}`
    try {
      this.logger.debug('Confirming Telegram authentication', {
        details: {
          telegramId: options.id,
          isBinding: options.isBinding,
          hasTwoFactorType: !!options.twoFactorType,
          hasAbortSignal: !!options.abortSignal,
        },
        correlationId,
      })

      if (!options.id) {
        const error = new Error('Missing authentication ID for confirmation')
        this.logger.error('Failed to confirm Telegram auth: missing ID', error)
        return {
          isSuccess: false,
          error,
        }
      }

      const requestParams: Record<string, unknown> = {
        id: options.id,
      }

      if (options.isBinding) {
        requestParams.isBinding = true
      }

      if (options.twoFactorType) {
        requestParams.twoFactorType = options.twoFactorType
      }
      const headers: Record<string, string> = {}

      try {
        const response = await this.apiClient.post<AuthResult>(
          '/auth/telegram/confirm',
          requestParams,
          headers,
        )

        if (response.isSuccess) {
          this.logger.debug('Telegram auth confirmation successful', {
            details: {
              telegramId: options.id,
              userId: response.user?.id,
              requiresTwoFactor: response.requiresTwoFactor,
            },
            correlationId,
          })

          this.authLogger.logTelegramAuth(true, {
            telegramId: options.id,
            userId: response.user?.id,
            method: 'polling',
            isBinding: options.isBinding,
            requiresTwoFactor: response.requiresTwoFactor,
            correlationId,
          })
        } else {
          this.logger.debug('Telegram auth confirmation not yet complete', {
            details: {
              telegramId: options.id,
            },
            correlationId,
          })
        }

        return response
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          this.logger.debug('Telegram auth confirmation request aborted', {
            details: {
              telegramId: options.id,
            },
            correlationId,
          })
          return {
            isSuccess: false,
            error: new Error('Authentication request was aborted'),
          }
        }

        this.logger.error('Error during Telegram auth confirmation API request', error)
        this.authLogger.logTelegramAuth(false, {
          error: 'API confirmation request failed',
          telegramId: options.id,
          method: 'polling',
          correlationId,
        })

        return {
          isSuccess: false,
          error:
            error instanceof Error
              ? error
              : new Error('Unknown error during Telegram auth confirmation'),
        }
      }
    } catch (error) {
      this.logger.error('Error during Telegram auth confirmation', error)
      this.authLogger.logTelegramAuth(false, {
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'polling',
        telegramId: options.id,
        correlationId,
      })

      return {
        isSuccess: false,
        error:
          error instanceof Error
            ? error
            : new Error('Unknown error during Telegram auth confirmation'),
      }
    }
  }
}

import { TelegramAuthService } from '../../domain/services/telegram-auth'
import {
  AuthResult,
  AuthTokens,
  TelegramConfirmOptions,
  TelegramSignInResult,
  TgSignInOptions,
  TwoFactorMethodType,
  UserProfile,
} from '../../domain/models/auth.models'
import { HttpClient } from '../http/http-client.interface'
import { TokenStorage } from '../storage/token-storage.interface'
import { LoggerService } from '../../logging/services/logger.service'
import { AuthEvent } from '../../logging/models/auth-events.enum'
import { LogCategory } from '../../logging/models/log-category.enum'
import { LogLevel } from '../../logging/models/log-level.enum'
import { LogSource } from '../../logging/models/log-source.enum'
import { LogDetails } from '../../logging/models/log-details.model'

export interface ApiTelegramAuthServiceConfig {
  apiBaseUrl: string
  endpoints: {
    auth: string
    init: string
    confirm: string
  }
}

export class ApiTelegramAuthService implements TelegramAuthService {
  private httpClient: HttpClient
  private tokenStorage: TokenStorage
  private config: ApiTelegramAuthServiceConfig
  private logger?: LoggerService
  private log(event: {
    action: string
    category: LogCategory
    level: LogLevel
    source: LogSource
    details?: LogDetails
    success?: boolean
    correlationId?: string
  }): void {
    if (!this.logger) return

    try {
      this.logger.log({
        action: event.action,
        category: event.category,
        level: event.level,
        source: event.source,
        details: event.details || {},
        success: event.success,
        correlationId: event.correlationId,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error('Ошибка при логировании:', error)
    }
  }

  constructor(
    httpClient: HttpClient,
    tokenStorage: TokenStorage,
    config: ApiTelegramAuthServiceConfig,
    logger?: LoggerService,
  ) {
    this.httpClient = httpClient
    this.tokenStorage = tokenStorage
    this.config = config
    this.logger = logger
    this.httpClient.setBaseUrl(config.apiBaseUrl)
  }

  async initSignIn(options: TgSignInOptions): Promise<TelegramSignInResult> {
    const correlationId = `tg_auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    this.log({
      action: AuthEvent.TELEGRAM_AUTH_INIT,
      category: LogCategory.AUTH,
      level: LogLevel.CRITICAL,
      source: LogSource.FRONTEND,
      details: {
        botName: options.botName,
        isBinding: options.isBinding || false,
        hasRedirect: !!options.redirectUrl,
        origin: options.origin,
      },
      correlationId,
    })

    try {
      const { botName, redirectUrl } = options
      const baseUrl = `https://oauth.telegram.org/auth?bot_id=${botName}`
      const redirectParam = redirectUrl ? `&redirect_url=${encodeURIComponent(redirectUrl)}` : ''
      const randomParam = `&random=${Math.random().toString(36).substring(2, 15)}`
      const bindingParam = options.isBinding ? '&binding_mode=true' : ''
      const authUrl = `${baseUrl}${redirectParam}${bindingParam}${randomParam}`

      try {
        const response = await this.httpClient.post<{
          id?: string
          code?: string
          qr?: string
          linkToBot?: string
        }>(this.config.endpoints.init, {
          botName,
          redirectUrl,
          origin: options.origin,
          isBinding: options.isBinding,
        })

        // Логируем успешную инициализацию
        this.log({
          action: AuthEvent.TELEGRAM_AUTH_INIT,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: {
            hasId: !!response.id,
            hasCode: !!response.code,
            hasQr: !!response.qr,
            hasLinkToBot: !!response.linkToBot,
            isBinding: options.isBinding || false,
          },
          success: true,
          correlationId,
        })

        return {
          url: authUrl,
          id: response.id,
          code: response.code,
          qr: response.qr,
          linkToBot: response.linkToBot,
        }
      } catch (error) {
        // Логируем ошибку инициализации API
        this.log({
          action: AuthEvent.TELEGRAM_AUTH_INIT,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: {
            error: error instanceof Error ? error.message : 'Неизвестная ошибка API',
            isBinding: options.isBinding || false,
          },
          success: false,
          correlationId,
        })
        return { url: authUrl }
      }
    } catch (error) {
      // Логируем критическую ошибку
      this.log({
        action: AuthEvent.TELEGRAM_AUTH_FAILURE,
        category: LogCategory.AUTH,
        level: LogLevel.CRITICAL,
        source: LogSource.FRONTEND,
        details: {
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
          isBinding: options.isBinding || false,
        },
        success: false,
        correlationId,
      })

      throw new Error(
        `Ошибка инициализации Telegram аутентификации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      )
    }
  }

  async handleAuthResult(data: Record<string, unknown>): Promise<AuthResult> {
    const correlationId = `tg_auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Логируем попытку обработки результата аутентификации
    this.log({
      action: AuthEvent.TELEGRAM_AUTH_CONFIRM_ATTEMPT,
      category: LogCategory.AUTH,
      level: LogLevel.CRITICAL,
      source: LogSource.FRONTEND,
      details: {
        hasId: !!data.id,
        hasAuthDate: !!data.auth_date,
        hasHash: !!data.hash,
      },
      correlationId,
    })

    try {
      if (!this.validateTelegramData(data)) {
        // Логируем невалидные данные
        this.log({
          action: AuthEvent.TELEGRAM_AUTH_CONFIRM_FAILURE,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: { error: 'Невалидные данные аутентификации Telegram' },
          success: false,
          correlationId,
        })

        return {
          isSuccess: false,
          error: new Error('Невалидные данные аутентификации Telegram'),
        }
      }

      const response = await this.httpClient.post<{
        tokens: AuthTokens
        user: UserProfile
        requiresTwoFactor?: boolean
        twoFactorMethods?: string[]
      }>(this.config.endpoints.auth, { telegramData: data })

      if (response.requiresTwoFactor) {
        // Логируем запрос двухфакторной аутентификации
        this.log({
          action: AuthEvent.TWO_FACTOR_METHODS_LOADED,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: {
            methodsCount: response.twoFactorMethods?.length || 0,
            methods: response.twoFactorMethods,
          },
          success: true,
          correlationId,
        })

        return {
          isSuccess: false,
          requiresTwoFactor: true,
          twoFactorMethods: response.twoFactorMethods?.map(method => ({
            id: method,
            type: method as TwoFactorMethodType,
            isAvailable: true,
            isConfigured: true,
          })),
        }
      }

      if (response.tokens) {
        this.tokenStorage.saveTokens(response.tokens)
      }

      // Логируем успешную аутентификацию
      this.log({
        action: AuthEvent.TELEGRAM_AUTH_SUCCESS,
        category: LogCategory.AUTH,
        level: LogLevel.CRITICAL,
        source: LogSource.FRONTEND,
        details: {
          userId: response.user?.id,
          hasTokens: !!response.tokens,
        },
        success: true,
        correlationId,
      })

      return {
        isSuccess: true,
        tokens: response.tokens,
        user: response.user,
      }
    } catch (error: unknown) {
      // Логируем ошибку аутентификации
      const errorMessage =
        error instanceof Error ? error.message : 'Ошибка аутентификации через Telegram'
      this.log({
        action: AuthEvent.TELEGRAM_AUTH_FAILURE,
        category: LogCategory.AUTH,
        level: LogLevel.CRITICAL,
        source: LogSource.FRONTEND,
        details: { error: errorMessage },
        success: false,
        correlationId,
      })

      return {
        isSuccess: false,
        error: new Error(errorMessage),
      }
    }
  }

  validateTelegramData(data: Record<string, unknown>): boolean {
    if (!data.id || !data.auth_date || !data.hash) {
      return false
    }
    const authDate = parseInt(data.auth_date as string, 10)
    const currentTime = Math.floor(Date.now() / 1000)

    if (currentTime - authDate > 3600) {
      return false
    }

    // Примечание: полная проверка хеша должна выполняться на сервере,
    // так как для этого требуется секретный ключ бота
    // Здесь мы делаем только базовые проверки

    return true
  }

  async initialize(): Promise<void> {
    return Promise.resolve()
  }

  createLoginWidget(
    _elementId: string,
    _options: { size?: 'large' | 'medium' | 'small' } = {},
  ): void {
    throw new Error('Метод createLoginWidget не поддерживается в API реализации')
  }

  async authenticateWithWidget(): Promise<AuthResult> {
    return Promise.reject({
      isSuccess: false,
      error: new Error('Метод authenticateWithWidget не поддерживается в API реализации'),
    })
  }

  async confirmAuth(options: TelegramConfirmOptions): Promise<AuthResult> {
    const correlationId = `tg_auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Логируем начало процесса подтверждения аутентификации
    this.log({
      action: AuthEvent.TELEGRAM_AUTH_POLLING_START,
      category: LogCategory.AUTH,
      level: LogLevel.CRITICAL,
      source: LogSource.FRONTEND,
      details: {
        id: options.id,
        isBinding: options.isBinding || false,
        hasTwoFactorType: !!options.twoFactorType,
        twoFactorType: options.twoFactorType,
      },
      correlationId,
    })

    try {
      if (!options.id) {
        // Логируем ошибку отсутствия ID
        this.log({
          action: AuthEvent.TELEGRAM_AUTH_CONFIRM_FAILURE,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: { error: 'Отсутствует идентификатор аутентификации для подтверждения' },
          success: false,
          correlationId,
        })

        return {
          isSuccess: false,
          error: new Error('Отсутствует идентификатор аутентификации для подтверждения'),
        }
      }

      const requestParams: Record<string, unknown> = {
        id: options.id,
      }
      if (options.isBinding) {
        requestParams.isBinding = true

        // Логируем использование режима привязки
        this.log({
          action: AuthEvent.TELEGRAM_AUTH_BINDING,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: { id: options.id },
          correlationId,
        })
      }

      if (options.twoFactorType) {
        requestParams.twoFactorType = options.twoFactorType

        // Логируем использование двухфакторной аутентификации
        this.log({
          action: AuthEvent.TWO_FACTOR_VERIFY_SUCCESS,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: {
            id: options.id,
            method: options.twoFactorType,
          },
          correlationId,
        })
      }

      const requestOptions: Record<string, unknown> = {}
      if (options.abortSignal) {
        requestOptions.signal = options.abortSignal
      }

      // Логируем попытку подтверждения
      this.log({
        action: AuthEvent.TELEGRAM_AUTH_CONFIRM_ATTEMPT,
        category: LogCategory.AUTH,
        level: LogLevel.CRITICAL,
        source: LogSource.FRONTEND,
        details: {
          id: options.id,
          isBinding: !!options.isBinding,
          hasTwoFactorType: !!options.twoFactorType,
        },
        correlationId,
      })

      const response = await this.httpClient.post<{
        isSuccess: boolean
        tokens?: AuthTokens
        user?: UserProfile
        requiresTwoFactor?: boolean
        twoFactorMethods?: TwoFactorMethodType[]
        error?: string
      }>(this.config.endpoints.confirm, requestParams, requestOptions)

      if (response.isSuccess && response.tokens) {
        this.tokenStorage.saveTokens(response.tokens)

        // Логируем успешное подтверждение
        this.log({
          action: AuthEvent.TELEGRAM_AUTH_CONFIRM_SUCCESS,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: {
            id: options.id,
            userId: response.user?.id,
            isBinding: !!options.isBinding,
          },
          success: true,
          correlationId,
        })

        // Логируем окончание polling
        this.log({
          action: AuthEvent.TELEGRAM_AUTH_POLLING_END,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: { id: options.id, result: 'success' },
          success: true,
          correlationId,
        })

        return {
          isSuccess: true,
          tokens: response.tokens,
          user: response.user,
        }
      }

      if (response.requiresTwoFactor) {
        // Логируем запрос двухфакторной аутентификации
        this.log({
          action: AuthEvent.TWO_FACTOR_METHODS_LOADED,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: {
            id: options.id,
            methodsCount: response.twoFactorMethods?.length || 0,
            methods: response.twoFactorMethods,
          },
          success: true,
          correlationId,
        })

        return {
          isSuccess: false,
          requiresTwoFactor: true,
          twoFactorMethods: response.twoFactorMethods?.map(method => ({
            id: method,
            type: method,
            isAvailable: true,
            isConfigured: true,
          })),
          id: options.id,
        }
      }

      return {
        isSuccess: false,
        id: options.id,
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Логируем отмену аутентификации
        this.log({
          action: AuthEvent.TELEGRAM_AUTH_ABORT,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: { id: options.id },
          correlationId,
        })

        // Логируем окончание polling
        this.log({
          action: AuthEvent.TELEGRAM_AUTH_POLLING_END,
          category: LogCategory.AUTH,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          details: { id: options.id, result: 'aborted' },
          correlationId,
        })

        return {
          isSuccess: false,
          error: new Error('Запрос аутентификации был отменен'),
        }
      }

      // Логируем ошибку подтверждения
      this.log({
        action: AuthEvent.TELEGRAM_AUTH_CONFIRM_FAILURE,
        category: LogCategory.AUTH,
        level: LogLevel.CRITICAL,
        source: LogSource.FRONTEND,
        details: {
          id: options.id,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        },
        success: false,
        correlationId,
      })

      // Логируем окончание polling
      this.log({
        action: AuthEvent.TELEGRAM_AUTH_POLLING_END,
        category: LogCategory.AUTH,
        level: LogLevel.CRITICAL,
        source: LogSource.FRONTEND,
        details: { id: options.id, result: 'error' },
        correlationId,
      })

      return {
        isSuccess: false,
        error:
          error instanceof Error
            ? error
            : new Error('Ошибка при подтверждении аутентификации Telegram'),
      }
    }
  }
}

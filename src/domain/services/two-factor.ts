import { AuthResult, TwoFactorMethod, TwoFactorMethodType } from '../models/auth.models'
import { TwoFactorSetupResponse } from '../models/two-factor-setup.model'
import { ApiClient } from '../../adapters/api/api-client.interface'
import { AuthConfig } from '../../config/auth-config'
import { LoggerService } from '../../logging/logger.service'
import { AuthLoggerService } from '../../logging/services/auth-logger.service'
import { TelegramAuthAdapter } from '../../adapters/telegram/telegram-auth.adapter'
import { LogCategory } from '../../logging/models/log-category.enum'
import { LogLevel } from '../../logging/models/log-level.enum'
import { TwoFactorLogDetails } from '../../logging/models/two-factor-log-details.model'

export interface TwoFactorService {
  verifyCode(code: string, method: TwoFactorMethod): Promise<AuthResult>
  sendCode(method: TwoFactorMethod): Promise<void>
  getAvailableMethods(): Promise<TwoFactorMethod[]>
  setupMethod(method: TwoFactorMethod): Promise<TwoFactorSetupResponse>
  confirmMethodSetup(method: TwoFactorMethod, code: string): Promise<void>
  disableMethod(method: TwoFactorMethod): Promise<void>
  initialize?(): Promise<void>
}

export class TwoFactor implements TwoFactorService {
  protected readonly apiClient: ApiClient
  protected readonly config: AuthConfig
  protected readonly logger: LoggerService
  protected readonly telegramAdapter?: TelegramAuthAdapter
  protected readonly authLogger: AuthLoggerService

  constructor(
    apiClient: ApiClient,
    config: AuthConfig,
    logger: LoggerService,
    telegramAdapter?: TelegramAuthAdapter,
  ) {
    this.apiClient = apiClient
    this.config = config
    this.logger = logger
    this.telegramAdapter = telegramAdapter
    this.authLogger = new AuthLoggerService(logger)
  }

  async initialize(): Promise<void> {
    const correlationId = `2fa-init-${Date.now()}`
    try {
      const logDetails: TwoFactorLogDetails = {
        correlationId,
      }
      this.logger.debug('Initializing two-factor authentication service', logDetails)

      if (this.telegramAdapter) {
        await this.telegramAdapter.initialize()
        const telegramLogDetails: TwoFactorLogDetails = {
          correlationId,
        }
        this.logger.debug(
          'Two-factor service initialized with Telegram support',
          telegramLogDetails,
        )
      }

      this.logger.info('Two-factor authentication service initialized', {
        category: LogCategory.SYSTEM,
        action: 'two_factor_init',
        success: true,
        details: {
          hasTelegramSupport: !!this.telegramAdapter,
          correlationId,
        },
      })

      this.authLogger.logSystemEvent(
        'Two-factor authentication service initialized',
        LogLevel.INFO,
        {
          action: 'two_factor_init',
          correlationId,
        },
      )
    } catch (error: unknown) {
      this.logger.error('Error initializing two-factor authentication service', error)

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.authLogger.logSystemEvent(
        'Failed to initialize two-factor authentication service',
        LogLevel.CRITICAL,
        {
          error: errorMessage,
          correlationId,
        },
      )

      throw error
    }
  }

  async verifyCode(code: string, method: TwoFactorMethod): Promise<AuthResult> {
    const correlationId = `2fa-verify-${method.type}-${Date.now()}`
    try {
      const logDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        correlationId,
      }
      this.logger.debug('Verifying 2FA code', logDetails)

      // Специальная обработка для Telegram
      if (method.type === TwoFactorMethodType.TELEGRAM && this.telegramAdapter) {
        const result = await this.verifyTelegramCode(method)

        if (result.isSuccess) {
          const successLogDetails: TwoFactorLogDetails = {
            methodType: method.type,
            methodId: method.id,
            correlationId,
          }
          this.authLogger.logTwoFactorVerification(true, successLogDetails)
        } else {
          const errorLogDetails: TwoFactorLogDetails = {
            methodType: method.type,
            methodId: method.id,
            correlationId,
            error: result.error?.message || 'Telegram verification failed',
          }
          this.authLogger.logTwoFactorVerification(false, errorLogDetails)
        }

        return result
      }

      const endpoint = `${this.config.api.twoFactorEndpoint}/verify`
      const response = await this.apiClient.post<AuthResult>(endpoint, {
        code,
        methodId: method.id,
        methodType: method.type,
      })

      this.logger.debug('2FA code verified successfully', { correlationId })
      this.authLogger.logTwoFactorVerification(true, {
        methodType: method.type,
        methodId: method.id,
        correlationId,
      })

      return response
    } catch (error: unknown) {
      this.logger.error('Error verifying 2FA code', error)

      this.authLogger.logTwoFactorVerification(false, {
        methodType: method.type,
        methodId: method.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      })

      return {
        isSuccess: false,
        error: error instanceof Error ? error : new Error('Unknown error during 2FA verification'),
      }
    }
  }

  private async verifyTelegramCode(method: TwoFactorMethod): Promise<AuthResult> {
    const correlationId = `telegram-2fa-verify-${method.id}-${Date.now()}`

    if (!this.telegramAdapter) {
      const errorMessage = 'Telegram adapter not initialized'
      this.logger.error(errorMessage)
      const errorLogDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        error: errorMessage,
        correlationId,
      }
      this.authLogger.logTwoFactorVerification(false, errorLogDetails)

      return {
        isSuccess: false,
        error: new Error(errorMessage),
      }
    }

    try {
      const logDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        correlationId,
      }
      this.logger.debug('Starting Telegram 2FA verification', logDetails)
      const result = await this.telegramAdapter.authenticate()

      if (!result.isSuccess || !result.userData) {
        const errorMessage = result.error?.message || 'Telegram authentication failed'
        this.logger.error(`Telegram 2FA verification failed: ${errorMessage}`)

        const errorLogDetails: TwoFactorLogDetails = {
          methodType: method.type,
          methodId: method.id,
          error: errorMessage,
          correlationId,
          telegramAuthResult: result.isSuccess,
        }
        this.authLogger.logTwoFactorVerification(false, errorLogDetails)

        return {
          isSuccess: false,
          error: result.error || new Error(errorMessage),
        }
      }

      const endpoint = `${this.config.api.twoFactorEndpoint}/verify/telegram`
      try {
        const apiLogDetails: TwoFactorLogDetails = {
          methodType: method.type,
          methodId: method.id,
          correlationId,
        }
        this.logger.debug('Sending Telegram auth data to backend for verification', apiLogDetails)

        const response = await this.apiClient.post<AuthResult>(endpoint, {
          methodId: method.id,
          telegramData: result.userData,
        })

        this.logger.debug('Telegram 2FA verification successful', { correlationId })
        const successLogDetails: TwoFactorLogDetails = {
          methodType: method.type,
          methodId: method.id,
          correlationId,
          telegramUserId: result.userData.id,
        }
        this.authLogger.logTwoFactorVerification(true, successLogDetails)

        return response
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        this.logger.error('Error during Telegram 2FA API verification', error)

        const errorLogDetails: TwoFactorLogDetails = {
          methodType: method.type,
          methodId: method.id,
          error: errorMessage,
          correlationId,
          stage: 'backend_verification',
        }
        this.authLogger.logTwoFactorVerification(false, errorLogDetails)

        return {
          isSuccess: false,
          error:
            error instanceof Error
              ? error
              : new Error('Unknown error during Telegram 2FA verification'),
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Error during Telegram 2FA verification', error)

      const errorLogDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        error: errorMessage,
        correlationId,
        stage: 'telegram_widget',
      }
      this.authLogger.logTwoFactorVerification(false, errorLogDetails)

      return {
        isSuccess: false,
        error:
          error instanceof Error
            ? error
            : new Error('Unknown error during Telegram 2FA verification'),
      }
    }
  }
  async sendCode(method: TwoFactorMethod): Promise<void> {
    const correlationId = `2fa-send-${method.type}-${Date.now()}`
    try {
      const logDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        correlationId,
      }
      this.logger.debug('Sending 2FA code', logDetails)
      if (method.type === TwoFactorMethodType.TELEGRAM && this.telegramAdapter) {
        await this.sendTelegramCode(method)

        const successLogDetails: TwoFactorLogDetails = {
          methodType: method.type,
          methodId: method.id,
          correlationId,
        }
        this.authLogger.logSend2FACode(true, successLogDetails)

        return
      }

      const endpoint = `${this.config.api.twoFactorEndpoint}/send`
      await this.apiClient.post(endpoint, {
        methodId: method.id,
        methodType: method.type,
      })

      this.logger.debug('2FA code sent successfully', { correlationId })
      const successLogDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        correlationId,
      }
      this.authLogger.logSend2FACode(true, successLogDetails)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Error sending 2FA code', error)

      const errorLogDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        error: errorMessage,
        correlationId,
      }
      this.authLogger.logSend2FACode(false, errorLogDetails)

      throw error
    }
  }
  async getAvailableMethods(): Promise<TwoFactorMethod[]> {
    const correlationId = `2fa-methods-${Date.now()}`
    try {
      const logDetails: TwoFactorLogDetails = {
        correlationId,
      }
      this.logger.debug('Getting available 2FA methods', logDetails)

      const endpoint = `${this.config.api.twoFactorEndpoint}/methods`
      const methods = await this.apiClient.get<TwoFactorMethod[]>(endpoint)

      this.logger.debug('Available 2FA methods retrieved', logDetails)

      const successLogDetails: TwoFactorLogDetails = {
        methodsCount: methods.length,
        methodTypes: methods.map(m => m.type).join(','),
      }
      this.authLogger.logTwoFactorMethodsLoaded(true, successLogDetails)

      return methods
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Error getting available 2FA methods', { error: errorMessage })

      const errorLogDetails: TwoFactorLogDetails = {
        error: errorMessage,
      }
      this.authLogger.logTwoFactorMethodsLoadError(errorMessage, errorLogDetails)

      return []
    }
  }

  async setupMethod(method: TwoFactorMethod): Promise<TwoFactorSetupResponse> {
    try {
      const logDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
      }
      this.logger.debug('Setting up 2FA method', logDetails)

      if (method.type === TwoFactorMethodType.TELEGRAM && this.telegramAdapter) {
        return await this.setupTelegramMethod()
      }

      const endpoint = `${this.config.api.twoFactorEndpoint}/setup`
      const response = await this.apiClient.post<TwoFactorSetupResponse>(endpoint, {
        methodType: method.type,
      })

      this.logger.debug('2FA method setup initiated')
      return response
    } catch (error: unknown) {
      this.logger.error('Error setting up 2FA method', error)
      throw error
    }
  }

  private async setupTelegramMethod(): Promise<TwoFactorSetupResponse> {
    if (!this.telegramAdapter) {
      throw new Error('Telegram adapter not initialized')
    }

    try {
      // Для Telegram нам нужно просто показать виджет для связывания аккаунта
      await this.initialize()
      const containerId = 'telegram-2fa-container'
      const widgetId = 'telegram-2fa-widget'

      if (!document.getElementById(containerId)) {
        const container = document.createElement('div')
        container.id = containerId
        container.style.display = 'none'
        const widget = document.createElement('div')
        widget.id = widgetId
        container.appendChild(widget)
        document.body.appendChild(container)
      }
      const widget = document.getElementById(widgetId)
      if (widget) {
        this.telegramAdapter.createLoginWidget(widgetId, { size: 'large' })
      }

      return {
        setupData: {
          methodType: TwoFactorMethodType.TELEGRAM,
          message:
            'Нажмите на кнопку "Log in with Telegram" для связывания вашего аккаунта Telegram',
          widgetId,
        },
      }
    } catch (error: unknown) {
      this.logger.error('Error setting up Telegram 2FA method', error)
      throw error
    }
  }

  async confirmMethodSetup(method: TwoFactorMethod, code: string): Promise<void> {
    try {
      const logDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
      }
      this.logger.debug('Confirming 2FA method setup', logDetails)

      if (method.type === TwoFactorMethodType.TELEGRAM && this.telegramAdapter) {
        await this.confirmTelegramMethodSetup(method)
        return
      }

      const endpoint = `${this.config.api.twoFactorEndpoint}/confirm`
      await this.apiClient.post(endpoint, {
        methodType: method.type,
        code,
      })

      this.logger.debug('2FA method setup confirmed successfully')
    } catch (error: unknown) {
      this.logger.error('Error confirming 2FA method setup', error)
      throw error
    }
  }

  private async confirmTelegramMethodSetup(method: TwoFactorMethod): Promise<void> {
    const correlationId = `telegram-2fa-confirm-${method.id}-${Date.now()}`

    if (!this.telegramAdapter) {
      const errorMessage = 'Telegram adapter not initialized'
      this.logger.error(errorMessage)

      const errorLogDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        error: errorMessage,
        correlationId,
      }
      this.authLogger.logTelegramAuth(false, errorLogDetails)

      throw new Error(errorMessage)
    }

    try {
      const containerId = 'telegram-2fa-container'
      const container = document.getElementById(containerId)
      if (container) {
        container.style.display = 'block'
      }

      const result = await this.telegramAdapter.authenticate()

      if (container) {
        container.style.display = 'none'
      }

      if (!result.isSuccess || !result.userData) {
        const errorMessage = 'Telegram authentication failed'
        this.logger.error(errorMessage)

        const errorLogDetails: TwoFactorLogDetails = {
          methodType: method.type,
          methodId: method.id,
          error: errorMessage,
          correlationId,
          telegramAuthResult: result.isSuccess,
        }
        this.authLogger.logTelegramAuth(false, errorLogDetails)

        throw new Error(errorMessage)
      }

      const endpoint = `${this.config.api.twoFactorEndpoint}/confirm/telegram`
      await this.apiClient.post(endpoint, {
        methodType: method.type,
        telegramData: result.userData,
      })

      const successLogDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        correlationId,
        telegramUserId: result.userData?.id,
      }
      this.logger.debug('Telegram 2FA method setup confirmed successfully', successLogDetails)
      this.authLogger.logTelegramAuth(true, successLogDetails)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Error confirming Telegram 2FA method setup', error)

      const errorLogDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        error: errorMessage,
        correlationId,
        stage: 'telegram_confirmation',
      }
      this.authLogger.logTelegramAuth(false, errorLogDetails)

      const containerId = 'telegram-2fa-container'
      const container = document.getElementById(containerId)
      if (container) {
        container.style.display = 'none'
      }

      throw error
    }
  }

  async disableMethod(method: TwoFactorMethod): Promise<void> {
    try {
      const logDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
      }
      this.logger.debug('Disabling 2FA method', logDetails)

      const endpoint = `${this.config.api.twoFactorEndpoint}/disable`
      await this.apiClient.post(endpoint, {
        methodId: method.id,
        methodType: method.type,
      })

      this.logger.debug('2FA method disabled successfully')
    } catch (error: unknown) {
      this.logger.error('Error disabling 2FA method', error)
      throw error
    }
  }

  private async sendTelegramCode(method: TwoFactorMethod): Promise<void> {
    const correlationId = `telegram-2fa-send-${method.id}-${Date.now()}`

    if (!this.telegramAdapter) {
      const errorMessage = 'Telegram adapter not initialized'
      this.logger.error(errorMessage)

      const errorLogDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        error: errorMessage,
        correlationId,
      }
      this.authLogger.logTelegramAuth(false, errorLogDetails)

      throw new Error(errorMessage)
    }

    try {
      const logDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        correlationId,
      }
      this.logger.debug('Preparing Telegram 2FA widget', logDetails)

      const containerId = 'telegram-2fa-container'
      const widgetId = 'telegram-2fa-widget'

      if (!document.getElementById(containerId)) {
        const container = document.createElement('div')
        container.id = containerId
        container.style.display = 'none'
        const widget = document.createElement('div')
        widget.id = widgetId
        container.appendChild(widget)
        document.body.appendChild(container)
      }

      const widget = document.getElementById(widgetId)
      if (widget) {
        this.telegramAdapter.createLoginWidget(widgetId, { size: 'large' })

        this.logger.debug('Telegram 2FA widget created successfully', { correlationId })
        const successLogDetails: TwoFactorLogDetails = {
          methodType: method.type,
          methodId: method.id,
          widgetId,
          correlationId,
        }
        this.authLogger.logTelegramAuth(true, successLogDetails)
      } else {
        throw new Error('Failed to find widget element')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Error preparing Telegram 2FA widget', error)

      const errorLogDetails: TwoFactorLogDetails = {
        methodType: method.type,
        methodId: method.id,
        error: errorMessage,
        correlationId,
      }
      this.authLogger.logTelegramAuth(false, errorLogDetails)

      throw error
    }
  }
}

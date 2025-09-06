import { TelegramAuthAdapter, TelegramUserData } from './telegram-auth.adapter'
import { LoggerService } from '../../logging/logger.service'
import { TelegramAuthConfig } from '../../config/auth-config'
import { TwoFactorMethod, TwoFactorMethodType } from '../../domain/models/auth.models'
import { AuthLoggerService } from '../../logging/services/auth-logger.service'
import { AuthEvent } from '../../logging/models/auth-events.enum'
import { LogLevel } from '../../logging/models'

export interface TelegramVerificationResult {
  isSuccess: boolean
  userData?: TelegramUserData
  error?: Error
}

export class TelegramTwoFactorAdapter {
  private readonly authAdapter: TelegramAuthAdapter
  private readonly logger: LoggerService
  private readonly authLogger: AuthLoggerService
  // Конфигурация может понадобиться в будущем для дополнительных настроек
  // @ts-expect-error Переменная пока не используется, но будет нужна в будущем
  private readonly config: TelegramAuthConfig
  private readonly containerId = 'telegram-2fa-container'
  private readonly widgetId = 'telegram-2fa-widget'

  constructor(authAdapter: TelegramAuthAdapter, logger: LoggerService, config: TelegramAuthConfig) {
    this.authAdapter = authAdapter
    this.logger = logger
    this.authLogger = new AuthLoggerService(logger)
    this.config = config
  }

  async initialize(): Promise<void> {
    try {
      await this.authAdapter.initialize()

      if (!document.getElementById(this.containerId)) {
        const container = document.createElement('div')
        container.id = this.containerId
        container.style.display = 'none'

        const widget = document.createElement('div')
        widget.id = this.widgetId
        container.appendChild(widget)

        document.body.appendChild(container)
      }

      this.logger.debug('Telegram 2FA adapter initialized')
      this.authLogger.logSystemEvent('Telegram 2FA adapter initialized', LogLevel.INFO, {
        action: AuthEvent.SYSTEM_EVENT,
        component: 'telegram_2fa_adapter',
        widgetId: this.widgetId,
      })
    } catch (error) {
      this.logger.error('Error initializing Telegram 2FA adapter', error)
      throw error
    }
  }

  async sendCode(method: TwoFactorMethod): Promise<void> {
    try {
      if (method.type !== TwoFactorMethodType.TELEGRAM) {
        throw new Error('Invalid method type for Telegram 2FA')
      }

      this.logger.debug('Preparing Telegram 2FA widget')

      const container = document.getElementById(this.containerId)
      if (!container) {
        throw new Error('Telegram 2FA container not found')
      }

      const widget = document.getElementById(this.widgetId)
      if (!widget) {
        throw new Error('Telegram 2FA widget element not found')
      }

      this.authAdapter.createLoginWidget(this.widgetId, { size: 'medium' })

      this.logger.debug('Telegram 2FA code "sent" (widget prepared)')
      this.authLogger.logSend2FACode(true, {
        methodType: TwoFactorMethodType.TELEGRAM,
        methodId: method.id,
        widgetId: this.widgetId,
      })
    } catch (error) {
      this.logger.error('Error sending Telegram 2FA code', error)

      this.authLogger.logSend2FACode(false, {
        methodType: TwoFactorMethodType.TELEGRAM,
        methodId: method.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        widgetId: this.widgetId,
      })

      throw error
    }
  }

  async verifyCode(): Promise<TelegramVerificationResult> {
    try {
      this.logger.debug('Verifying Telegram 2FA code')

      const container = document.getElementById(this.containerId)
      if (container) {
        container.style.display = 'block'
      }

      const result = await this.authAdapter.authenticate()

      if (container) {
        container.style.display = 'none'
      }

      if (result.isSuccess) {
        this.authLogger.logTwoFactorVerification(true, {
          methodType: TwoFactorMethodType.TELEGRAM,
          userData: result.userData ? result.userData.id.toString() : undefined,
        })
      } else {
        this.authLogger.logTwoFactorVerification(false, {
          methodType: TwoFactorMethodType.TELEGRAM,
          error: result.error?.message || 'Verification failed',
        })
      }

      return result
    } catch (error) {
      this.logger.error('Error verifying Telegram 2FA code', error)

      const container = document.getElementById(this.containerId)
      if (container) {
        container.style.display = 'none'
      }

      const errorObj =
        error instanceof Error ? error : new Error('Unknown error during Telegram 2FA verification')

      this.authLogger.logTwoFactorVerification(false, {
        methodType: TwoFactorMethodType.TELEGRAM,
        error: errorObj.message,
      })

      return {
        isSuccess: false,
        error: errorObj,
      }
    }
  }

  async setupMethod(): Promise<{ setupData: any }> {
    try {
      this.logger.debug('Setting up Telegram 2FA method')
      await this.initialize()
      const widget = document.getElementById(this.widgetId)
      if (!widget) {
        throw new Error('Telegram 2FA widget element not found')
      }

      this.authAdapter.createLoginWidget(this.widgetId, { size: 'large' })
      const setupData = {
        message: 'Нажмите на кнопку "Log in with Telegram" для связывания вашего аккаунта Telegram',
        widgetId: this.widgetId,
      }

      // Логируем успешную настройку метода
      this.authLogger.logEnable2FA(true, {
        methodType: TwoFactorMethodType.TELEGRAM,
        setupPhase: 'initiated',
        widgetId: this.widgetId,
      })

      return { setupData }
    } catch (error) {
      this.logger.error('Error setting up Telegram 2FA method', error)

      // Логируем ошибку настройки метода
      this.authLogger.logEnable2FA(false, {
        methodType: TwoFactorMethodType.TELEGRAM,
        error: error instanceof Error ? error.message : 'Unknown error',
        setupPhase: 'initiated',
      })

      throw error
    }
  }

  async confirmMethodSetup(): Promise<TelegramUserData> {
    try {
      this.logger.debug('Confirming Telegram 2FA method setup')

      const container = document.getElementById(this.containerId)
      if (container) {
        container.style.display = 'block'
      }

      const result = await this.authAdapter.authenticate()

      if (container) {
        container.style.display = 'none'
      }

      if (!result.isSuccess || !result.userData) {
        const error = new Error('Telegram authentication failed')

        this.authLogger.logEnable2FA(false, {
          methodType: TwoFactorMethodType.TELEGRAM,
          error: error.message,
          setupPhase: 'confirmation',
        })

        throw error
      }

      // Логируем успешное подтверждение настройки
      this.authLogger.logEnable2FA(true, {
        methodType: TwoFactorMethodType.TELEGRAM,
        setupPhase: 'confirmed',
        userData: result.userData.id.toString(),
      })

      return result.userData
    } catch (error) {
      this.logger.error('Error confirming Telegram 2FA method setup', error)
      const container = document.getElementById(this.containerId)
      if (container) {
        container.style.display = 'none'
      }

      // Логируем ошибку подтверждения настройки
      this.authLogger.logEnable2FA(false, {
        methodType: TwoFactorMethodType.TELEGRAM,
        error: error instanceof Error ? error.message : 'Unknown error',
        setupPhase: 'confirmation',
      })

      throw error
    }
  }

  async disableMethod(): Promise<void> {
    this.logger.debug('Telegram 2FA method disabled')

    // Логируем отключение метода
    this.authLogger.logDisable2FA(true, {
      methodType: TwoFactorMethodType.TELEGRAM,
    })
  }
}

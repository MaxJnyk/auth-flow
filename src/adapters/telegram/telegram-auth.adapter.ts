import { TelegramAuthConfig } from '../../config/auth-config'
import { LoggerService } from '../../logging/logger.service'

export interface TelegramAuthResult {
  isSuccess: boolean
  userData?: TelegramUserData
  error?: Error
}

export interface TelegramUserData {
  id: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  authDate: number
  hash: string
}

export class TelegramAuthAdapter {
  private readonly config: TelegramAuthConfig
  private readonly scriptId = 'telegram-login-script'
  private readonly containerId = 'telegram-login-container'
  private readonly logger?: LoggerService

  constructor(config: TelegramAuthConfig, logger?: LoggerService) {
    this.config = config
    this.logger = logger
  }

  async initialize(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        if (document.getElementById(this.scriptId)) {
          this.logger?.debug?.('Telegram login script already loaded')
          resolve()
          return
        }

        if (!document.getElementById(this.containerId)) {
          const container = document.createElement('div')
          container.id = this.containerId
          container.style.display = 'none'
          document.body.appendChild(container)
        }

        const script = document.createElement('script')
        script.id = this.scriptId
        script.src = 'https://telegram.org/js/telegram-widget.js'
        script.async = true
        script.onload = () => {
          this.logger?.debug?.('Telegram login script loaded')
          resolve()
        }
        script.onerror = () => reject(new Error('Failed to load Telegram login script'))
        document.head.appendChild(script)
      } catch (error) {
        this.logger?.error?.('Error initializing Telegram auth', error)
        reject(error)
      }
    })
  }

  createLoginWidget(
    elementId: string,
    options: { size?: 'large' | 'medium' | 'small' } = {},
  ): void {
    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`Element with ID ${elementId} not found`)
      }
      element.innerHTML = ''
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://telegram.org/js/telegram-widget.js'
      script.dataset.telegramLogin = this.config.botId
      script.dataset.size = options.size || 'medium'

      if (this.config.redirectUrl) {
        script.dataset.authUrl = this.config.redirectUrl
      }

      if (this.config.requestAccess && this.config.requestAccess.length > 0) {
        script.dataset.requestAccess = this.config.requestAccess.join(',')
      }

      script.dataset.onauth = 'onTelegramAuth(user)'

      if (!window.onTelegramAuth) {
        window.onTelegramAuth = (user: TelegramUserData) => {
          this.logger?.debug?.('Telegram auth successful', {
            details: {
              telegramUserId: user.id.toString(),
              username: user.username || '',
            },
          })
          const event = new CustomEvent('telegram-auth', { detail: user })
          document.dispatchEvent(event)
        }
      }

      element.appendChild(script)
      this.logger?.debug?.('Telegram login widget created')
    } catch (error) {
      this.logger?.error?.('Error creating Telegram login widget', error)
      throw error
    }
  }

  authenticate(): Promise<TelegramAuthResult> {
    return new Promise(resolve => {
      const authHandler = (event: CustomEvent<TelegramUserData>) => {
        document.removeEventListener('telegram-auth', authHandler as EventListener)

        const userData = event.detail
        this.logger?.debug?.('Telegram auth data received', {
          details: {
            telegramUserId: userData.id.toString(),
            username: userData.username || '',
          },
        })

        if (this.validateAuthData(userData)) {
          resolve({
            isSuccess: true,
            userData,
          })
        } else {
          const error = new Error('Invalid Telegram auth data')
          this.logger?.error?.('Telegram auth validation failed', error)
          resolve({
            isSuccess: false,
            error,
          })
        }
      }

      document.addEventListener('telegram-auth', authHandler as EventListener)
      setTimeout(() => {
        document.removeEventListener('telegram-auth', authHandler as EventListener)
        resolve({
          isSuccess: false,
          error: new Error('Telegram auth timeout'),
        })
      }, 300000)
    })
  }

  private validateAuthData(userData: TelegramUserData): boolean {
    try {
      if (!userData.id || !userData.firstName || !userData.authDate || !userData.hash) {
        this.logger?.warn?.('Missing required fields in Telegram auth data')
        return false
      }
      const authDate = userData.authDate * 1000
      const now = Date.now()
      if (now - authDate > 86400000) {
        this.logger?.warn?.('Telegram auth data is too old')
        return false
      }

      return true
    } catch (error) {
      this.logger?.error?.('Error validating Telegram auth data', error)
      return false
    }
  }
}

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUserData) => void
  }
}

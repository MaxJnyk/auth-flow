import { LoggerService } from '../../logging/logger.service'
import { AuthEvent, LogCategory, LogLevel, LogSource } from '../models'
import { AuthLogDetails, SecurityLogDetails, SystemLogDetails } from '../models/log-details.model'
import { LogEvent } from '../models/log-event.model'
import { TwoFactorLogDetails } from '../models/two-factor-log-details.model'

export class AuthLoggerService {
  constructor(private logger: LoggerService) {}

  logLogin(success: boolean, details?: AuthLogDetails): void {
    this.logger.info(`User login ${success ? 'successful' : 'failed'}`, {
      category: LogCategory.AUTH,
      action: AuthEvent.LOGIN_SUCCESS,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logLogout(details?: AuthLogDetails): void {
    this.logger.info('User logout', {
      category: LogCategory.AUTH,
      action: AuthEvent.LOGOUT,
      level: LogLevel.INFO,
      source: LogSource.FRONTEND,
      success: true,
      details,
    })
  }

  logRegistration(success: boolean, details?: AuthLogDetails): void {
    this.logger.info(`User registration ${success ? 'successful' : 'failed'}`, {
      category: LogCategory.AUTH,
      action: AuthEvent.REGISTRATION_SUCCESS,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logPasswordChange(success: boolean, details?: SecurityLogDetails): void {
    this.logger.info(`Password change ${success ? 'successful' : 'failed'}`, {
      category: LogCategory.SECURITY,
      action: AuthEvent.PASSWORD_CHANGE,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logPasswordResetRequest(success: boolean, details?: SecurityLogDetails): void {
    this.logger.info(`Password reset request ${success ? 'successful' : 'failed'}`, {
      category: LogCategory.SECURITY,
      action: AuthEvent.PASSWORD_RESET_REQUEST,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logPasswordResetConfirm(success: boolean, details?: SecurityLogDetails): void {
    this.logger.info(`Password reset confirmation ${success ? 'successful' : 'failed'}`, {
      category: LogCategory.SECURITY,
      action: AuthEvent.PASSWORD_RESET_SUCCESS,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logEnable2FA(success: boolean, details?: SecurityLogDetails): void {
    this.logger.info(`2FA enable ${success ? 'successful' : 'failed'}`, {
      category: LogCategory.SECURITY,
      action: AuthEvent.TWO_FACTOR_ENABLE,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logDisable2FA(success: boolean, details?: SecurityLogDetails): void {
    this.logger.info(`2FA disable ${success ? 'successful' : 'failed'}`, {
      category: LogCategory.SECURITY,
      action: AuthEvent.TWO_FACTOR_DISABLE,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logVerify2FACode(success: boolean, details?: SecurityLogDetails): void {
    this.logger.info(`2FA code verification ${success ? 'successful' : 'failed'}`, {
      category: LogCategory.SECURITY,
      action: AuthEvent.TWO_FACTOR_VERIFY_SUCCESS,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logSend2FACode(success: boolean, details?: SecurityLogDetails): void {
    this.logger.info(`2FA code sending ${success ? 'successful' : 'failed'}`, {
      category: LogCategory.SECURITY,
      action: AuthEvent.TWO_FACTOR_SETUP,
      level: LogLevel.INFO,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logTwoFactorMethodsLoaded(success: boolean, details?: AuthLogDetails): void {
    this.logger.info(`2FA methods loading ${success ? 'successful' : 'failed'}`, {
      category: LogCategory.AUTH,
      action: AuthEvent.TWO_FACTOR_METHODS_LOADED,
      level: success ? LogLevel.INFO : LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logTwoFactorMethodsLoadError(errorMessage: string, details?: TwoFactorLogDetails): void {
    this.logger.error(`Error loading 2FA methods: ${errorMessage}`, {
      category: LogCategory.AUTH,
      action: AuthEvent.TWO_FACTOR_METHODS_LOAD_ERROR,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success: false,
      details: {
        ...details,
        error: errorMessage,
      },
    })
  }

  logTelegramAuth(success: boolean, details?: TwoFactorLogDetails): void {
    const message = success
      ? 'Telegram authentication prepared'
      : 'Failed to prepare Telegram authentication'

    this.logger.info(message, {
      category: LogCategory.AUTH,
      action: AuthEvent.LOGIN_SUCCESS,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logSuspiciousActivity(activity: string, details?: SecurityLogDetails): void {
    this.logger.error(`Suspicious activity detected: ${activity}`, {
      category: LogCategory.SECURITY,
      action: AuthEvent.SUSPICIOUS_ACTIVITY,
      level: LogLevel.CRITICAL,
      source: LogSource.FRONTEND,
      success: false,
      details,
    })
  }

  logSystemEvent(
    message: string,
    level: LogLevel.CRITICAL | LogLevel.IMPORTANT | LogLevel.INFO | LogLevel.DEBUG = LogLevel.INFO,
    details?: SystemLogDetails,
  ): void {
    const context: Partial<LogEvent> = {
      category: LogCategory.SYSTEM,
      action: details?.action || 'system_event',
      level: level,
      source: LogSource.FRONTEND,
      success: details?.success !== undefined ? Boolean(details.success) : true,
      details,
    }

    switch (level) {
      case LogLevel.DEBUG:
        this.logger.debug(message, context)
        break
      case LogLevel.INFO:
      case LogLevel.IMPORTANT:
        this.logger.info(message, context)
        break
      case LogLevel.CRITICAL:
        this.logger.error(message, null, context)
        break
      default:
        this.logger.info(message, context)
    }
  }

  logTwoFactorVerification(success: boolean, details?: TwoFactorLogDetails): void {
    const message = success ? '2FA verification successful' : '2FA verification failed'

    const level = success ? LogLevel.INFO : LogLevel.IMPORTANT
    const method = success ? 'info' : 'warn'

    this.logger[method](message, {
      category: LogCategory.AUTH,
      action: AuthEvent.TWO_FACTOR_VERIFY_SUCCESS,
      level,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }

  logAccountLock(reason: string, details?: SecurityLogDetails): void {
    this.logger.warn(`Account locked: ${reason}`, {
      category: LogCategory.SECURITY,
      action: AuthEvent.ACCOUNT_LOCK,
      level: LogLevel.CRITICAL,
      source: LogSource.FRONTEND,
      success: false,
      details: {
        ...details,
        reason,
      },
    })
  }

  logAccountUnlock(details?: SecurityLogDetails): void {
    this.logger.info('Account unlocked', {
      category: LogCategory.SECURITY,
      action: AuthEvent.ACCOUNT_UNLOCK,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success: true,
      details,
    })
  }

  logEmailVerification(success: boolean, details?: AuthLogDetails): void {
    this.logger.info(`Email verification ${success ? 'successful' : 'failed'}`, {
      category: LogCategory.PROFILE,
      action: AuthEvent.EMAIL_CHANGE,
      level: LogLevel.IMPORTANT,
      source: LogSource.FRONTEND,
      success,
      details,
    })
  }
}

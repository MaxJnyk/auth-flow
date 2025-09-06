import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthLoggerService } from '../../../src/logging/services/auth-logger.service'
import { LoggerService } from '../../../src/logging/logger.service'
import { AuthEvent, LogCategory, LogLevel, LogSource } from '../../../src/logging/models'

describe('AuthLoggerService', () => {
  let authLoggerService: AuthLoggerService
  let mockLoggerService: LoggerService

  beforeEach(() => {
    // Создаем мок для LoggerService
    mockLoggerService = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as LoggerService

    // Создаем экземпляр AuthLoggerService с моком
    authLoggerService = new AuthLoggerService(mockLoggerService)
  })

  describe('logLogin', () => {
    it('should log successful login', () => {
      // Arrange
      const details = { userId: '123', email: 'test@example.com' }

      // Act
      authLoggerService.logLogin(true, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('User login successful', {
        category: LogCategory.AUTH,
        action: AuthEvent.LOGIN_SUCCESS,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })

    it('should log failed login', () => {
      // Arrange
      const details = { email: 'test@example.com', reason: 'Invalid credentials' }

      // Act
      authLoggerService.logLogin(false, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('User login failed', {
        category: LogCategory.AUTH,
        action: AuthEvent.LOGIN_SUCCESS,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: false,
        details,
      })
    })
  })

  describe('logLogout', () => {
    it('should log user logout', () => {
      // Arrange
      const details = { userId: '123' }

      // Act
      authLoggerService.logLogout(details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('User logout', {
        category: LogCategory.AUTH,
        action: AuthEvent.LOGOUT,
        level: LogLevel.INFO,
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })
  })

  describe('logRegistration', () => {
    it('should log successful registration', () => {
      // Arrange
      const details = { userId: '123', email: 'test@example.com' }

      // Act
      authLoggerService.logRegistration(true, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('User registration successful', {
        category: LogCategory.AUTH,
        action: AuthEvent.REGISTRATION_SUCCESS,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })

    it('should log failed registration', () => {
      // Arrange
      const details = { email: 'test@example.com', reason: 'Email already exists' }

      // Act
      authLoggerService.logRegistration(false, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('User registration failed', {
        category: LogCategory.AUTH,
        action: AuthEvent.REGISTRATION_SUCCESS,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: false,
        details,
      })
    })
  })

  describe('logPasswordChange', () => {
    it('should log successful password change', () => {
      // Arrange
      const details = { userId: '123' }

      // Act
      authLoggerService.logPasswordChange(true, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Password change successful', {
        category: LogCategory.SECURITY,
        action: AuthEvent.PASSWORD_CHANGE,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })

    it('should log failed password change', () => {
      // Arrange
      const details = { userId: '123', reason: 'Invalid current password' }

      // Act
      authLoggerService.logPasswordChange(false, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Password change failed', {
        category: LogCategory.SECURITY,
        action: AuthEvent.PASSWORD_CHANGE,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: false,
        details,
      })
    })
  })

  describe('logPasswordResetRequest', () => {
    it('should log successful password reset request', () => {
      // Arrange
      const details = { email: 'test@example.com' }

      // Act
      authLoggerService.logPasswordResetRequest(true, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Password reset request successful', {
        category: LogCategory.SECURITY,
        action: AuthEvent.PASSWORD_RESET_REQUEST,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })

    it('should log failed password reset request', () => {
      // Arrange
      const details = { email: 'test@example.com', reason: 'User not found' }

      // Act
      authLoggerService.logPasswordResetRequest(false, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Password reset request failed', {
        category: LogCategory.SECURITY,
        action: AuthEvent.PASSWORD_RESET_REQUEST,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: false,
        details,
      })
    })
  })

  describe('logPasswordResetConfirm', () => {
    it('should log successful password reset confirmation', () => {
      // Arrange
      const details = { userId: '123' }

      // Act
      authLoggerService.logPasswordResetConfirm(true, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Password reset confirmation successful',
        {
          category: LogCategory.SECURITY,
          action: AuthEvent.PASSWORD_RESET_SUCCESS,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          success: true,
          details,
        },
      )
    })

    it('should log failed password reset confirmation', () => {
      // Arrange
      const details = { reason: 'Invalid or expired token' }

      // Act
      authLoggerService.logPasswordResetConfirm(false, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Password reset confirmation failed', {
        category: LogCategory.SECURITY,
        action: AuthEvent.PASSWORD_RESET_SUCCESS,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: false,
        details,
      })
    })
  })

  describe('logEnable2FA', () => {
    it('should log successful 2FA enable', () => {
      // Arrange
      const details = { userId: '123', method: 'totp' }

      // Act
      authLoggerService.logEnable2FA(true, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('2FA enable successful', {
        category: LogCategory.SECURITY,
        action: AuthEvent.TWO_FACTOR_ENABLE,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })

    it('should log failed 2FA enable', () => {
      // Arrange
      const details = { userId: '123', method: 'totp', reason: 'Invalid verification code' }

      // Act
      authLoggerService.logEnable2FA(false, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('2FA enable failed', {
        category: LogCategory.SECURITY,
        action: AuthEvent.TWO_FACTOR_ENABLE,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: false,
        details,
      })
    })
  })

  describe('logDisable2FA', () => {
    it('should log successful 2FA disable', () => {
      // Arrange
      const details = { userId: '123', method: 'totp' }

      // Act
      authLoggerService.logDisable2FA(true, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('2FA disable successful', {
        category: LogCategory.SECURITY,
        action: AuthEvent.TWO_FACTOR_DISABLE,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })

    it('should log failed 2FA disable', () => {
      // Arrange
      const details = { userId: '123', reason: 'Invalid password' }

      // Act
      authLoggerService.logDisable2FA(false, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('2FA disable failed', {
        category: LogCategory.SECURITY,
        action: AuthEvent.TWO_FACTOR_DISABLE,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: false,
        details,
      })
    })
  })

  describe('logVerify2FACode', () => {
    it('should log successful 2FA code verification', () => {
      // Arrange
      const details = { userId: '123', method: 'totp' }

      // Act
      authLoggerService.logVerify2FACode(true, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('2FA code verification successful', {
        category: LogCategory.SECURITY,
        action: AuthEvent.TWO_FACTOR_VERIFY_SUCCESS,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })

    it('should log failed 2FA code verification', () => {
      // Arrange
      const details = { userId: '123', method: 'totp', reason: 'Invalid code' }

      // Act
      authLoggerService.logVerify2FACode(false, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('2FA code verification failed', {
        category: LogCategory.SECURITY,
        action: AuthEvent.TWO_FACTOR_VERIFY_SUCCESS,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: false,
        details,
      })
    })
  })

  describe('logSuspiciousActivity', () => {
    it('should log suspicious activity', () => {
      // Arrange
      const activity = 'Multiple failed login attempts'
      const details = { userId: '123', ip: '192.168.1.1', attempts: 5 }

      // Act
      authLoggerService.logSuspiciousActivity(activity, details)

      // Assert
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Suspicious activity detected: Multiple failed login attempts',
        {
          category: LogCategory.SECURITY,
          action: AuthEvent.SUSPICIOUS_ACTIVITY,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          success: false,
          details,
        },
      )
    })
  })

  describe('logSystemEvent', () => {
    it('should log system event with INFO level', () => {
      // Arrange
      const message = 'System maintenance started'
      const details = { maintenanceId: '123' }

      // Act
      authLoggerService.logSystemEvent(message, LogLevel.INFO, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('System maintenance started', {
        category: LogCategory.SYSTEM,
        action: 'system_event',
        level: 'info',
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })

    it('should log system event with CRITICAL level', () => {
      // Arrange
      const message = 'System error occurred'
      const details = { errorId: '123', action: 'system_error', success: false }

      // Act
      authLoggerService.logSystemEvent(message, LogLevel.CRITICAL, details)

      // Assert
      expect(mockLoggerService.error).toHaveBeenCalledWith('System error occurred', null, {
        category: LogCategory.SYSTEM,
        action: 'system_error',
        level: 'critical',
        source: LogSource.FRONTEND,
        success: false,
        details,
      })
    })

    it('should log system event with DEBUG level', () => {
      // Arrange
      const message = 'Debug information'
      const details = { debugId: '123' }

      // Act
      authLoggerService.logSystemEvent(message, LogLevel.DEBUG, details)

      // Assert
      expect(mockLoggerService.debug).toHaveBeenCalledWith('Debug information', {
        category: LogCategory.SYSTEM,
        action: 'system_event',
        level: 'debug',
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })
  })

  describe('logAccountLock', () => {
    it('should log account lock', () => {
      // Arrange
      const reason = 'Too many failed login attempts'
      const details = { userId: '123', attempts: 5 }

      // Act
      authLoggerService.logAccountLock(reason, details)

      // Assert
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Account locked: Too many failed login attempts',
        {
          category: LogCategory.SECURITY,
          action: AuthEvent.ACCOUNT_LOCK,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          success: false,
          details: {
            ...details,
            reason,
          },
        },
      )
    })
  })

  describe('logAccountUnlock', () => {
    it('should log account unlock', () => {
      // Arrange
      const details = { userId: '123', unlockedBy: 'admin' }

      // Act
      authLoggerService.logAccountUnlock(details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Account unlocked', {
        category: LogCategory.SECURITY,
        action: AuthEvent.ACCOUNT_UNLOCK,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })
  })

  describe('logEmailVerification', () => {
    it('should log successful email verification', () => {
      // Arrange
      const details = { userId: '123', email: 'test@example.com' }

      // Act
      authLoggerService.logEmailVerification(true, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Email verification successful', {
        category: LogCategory.PROFILE,
        action: AuthEvent.EMAIL_CHANGE,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: true,
        details,
      })
    })

    it('should log failed email verification', () => {
      // Arrange
      const details = { email: 'test@example.com', reason: 'Invalid or expired token' }

      // Act
      authLoggerService.logEmailVerification(false, details)

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Email verification failed', {
        category: LogCategory.PROFILE,
        action: AuthEvent.EMAIL_CHANGE,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        success: false,
        details,
      })
    })
  })
})

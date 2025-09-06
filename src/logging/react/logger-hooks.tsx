import { useCallback, useEffect } from 'react'
import { useLogger } from './logger-context'
import { LogLevel, AuthEvent, LogCategory, LogSource } from '../models'

export const useAuthLogger = () => {
  const { logAuth } = useLogger()

  const logLogin = useCallback(
    (userId: string, details?: Record<string, any>, success: boolean = true) => {
      logAuth(
        AuthEvent.LOGIN_SUCCESS,
        { ...details, userId },
        success,
        success ? LogLevel.INFO : LogLevel.IMPORTANT,
      )
    },
    [logAuth],
  )

  // Логгирование выхода пользователя
  const logLogout = useCallback(
    (userId: string, details?: Record<string, any>) => {
      logAuth(AuthEvent.LOGOUT, { ...details, userId }, true, LogLevel.INFO)
    },
    [logAuth],
  )

  // Логгирование регистрации пользователя
  const logRegistration = useCallback(
    (userId: string, details?: Record<string, any>, success: boolean = true) => {
      logAuth(
        AuthEvent.REGISTRATION_SUCCESS,
        { ...details, userId },
        success,
        success ? LogLevel.INFO : LogLevel.IMPORTANT,
      )
    },
    [logAuth],
  )

  // Логгирование сброса пароля
  const logPasswordReset = useCallback(
    (userId: string, details?: Record<string, any>, success: boolean = true) => {
      logAuth(
        AuthEvent.PASSWORD_RESET_SUCCESS,
        { ...details, userId },
        success,
        success ? LogLevel.INFO : LogLevel.IMPORTANT,
      )
    },
    [logAuth],
  )

  // Логгирование изменения пароля
  const logPasswordChange = useCallback(
    (userId: string, details?: Record<string, any>, success: boolean = true) => {
      logAuth(
        AuthEvent.PASSWORD_CHANGE,
        { ...details, userId },
        success,
        success ? LogLevel.INFO : LogLevel.IMPORTANT,
      )
    },
    [logAuth],
  )

  // Логгирование двухфакторной аутентификации
  const log2FAUsage = useCallback(
    (userId: string, method: string, details?: Record<string, any>, success: boolean = true) => {
      logAuth(
        AuthEvent.TWO_FACTOR_VERIFY_SUCCESS,
        { ...details, userId, method },
        success,
        success ? LogLevel.INFO : LogLevel.IMPORTANT,
      )
    },
    [logAuth],
  )

  return {
    logLogin,
    logLogout,
    logRegistration,
    logPasswordReset,
    logPasswordChange,
    log2FAUsage,
  }
}

export const useSecurityLogger = () => {
  const { logger, context } = useLogger()

  // Логгирование попытки несанкционированного доступа
  const logUnauthorizedAccess = useCallback(
    (resource: string, details?: Record<string, any>) => {
      logger.log(
        {
          category: LogCategory.SECURITY,
          action: AuthEvent.PERMISSION_DENIED,
          details: { ...details, resource },
          success: false,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
        },
        context,
      )
    },
    [logger, context],
  )

  // Логгирование подозрительной активности
  const logSuspiciousActivity = useCallback(
    (activityType: string, details?: Record<string, any>) => {
      logger.log(
        {
          category: LogCategory.SECURITY,
          action: AuthEvent.SUSPICIOUS_ACTIVITY,
          details: { ...details, activityType },
          success: false,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
        },
        context,
      )
    },
    [logger, context],
  )

  // Логгирование блокировки аккаунта
  const logAccountLock = useCallback(
    (userId: string, reason: string, details?: Record<string, any>) => {
      logger.log(
        {
          category: LogCategory.SECURITY,
          action: AuthEvent.ACCOUNT_LOCK,
          details: { ...details, userId, reason },
          success: true,
          level: LogLevel.CRITICAL,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
        },
        context,
      )
    },
    [logger, context],
  )

  return {
    logUnauthorizedAccess,
    logSuspiciousActivity,
    logAccountLock,
  }
}

export const useComponentLogger = (componentName: string, level: LogLevel = LogLevel.DEBUG) => {
  const { logger, context } = useLogger()

  useEffect(() => {
    // Логгирование монтирования компонента
    logger.log(
      {
        category: LogCategory.SYSTEM,
        action: AuthEvent.SYSTEM_EVENT,
        details: { componentName, action: 'COMPONENT_MOUNT' },
        success: true,
        level,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
      },
      context,
    )

    // Логгирование размонтирования компонента
    return () => {
      logger.log(
        {
          category: LogCategory.SYSTEM,
          action: AuthEvent.SYSTEM_EVENT,
          details: { componentName, action: 'COMPONENT_UNMOUNT' },
          success: true,
          level,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
        },
        context,
      )
    }
  }, [componentName, level, logger, context])
}

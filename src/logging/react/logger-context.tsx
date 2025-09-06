import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { LoggerService } from '../services'
import { LogContext, LogEvent, LogLevel, LogCategory, AuthEvent, LogSource } from '../models'

export interface LoggerContextType {
  logger: LoggerService
  context: Partial<LogContext>
  updateContext: (newContext: Partial<LogContext>) => void
  log: (event: LogEvent) => void
  logAuth: (
    action: AuthEvent,
    details?: Record<string, any>,
    success?: boolean,
    level?: LogLevel,
  ) => void
  logSecurity: (
    action: AuthEvent,
    details?: Record<string, any>,
    success?: boolean,
    level?: LogLevel,
  ) => void
  logProfile: (
    action: AuthEvent,
    details?: Record<string, any>,
    success?: boolean,
    level?: LogLevel,
  ) => void
  enableLogging: () => void
  disableLogging: () => void
  isLoggingEnabled: boolean
}

const LoggerContext = createContext<LoggerContextType | null>(null)

export interface LoggerProviderProps {
  logger: LoggerService
  initialContext?: Partial<LogContext>
  children: ReactNode
  logEnabled?: boolean
}

export const LoggerProvider: React.FC<LoggerProviderProps> = ({
  logger,
  initialContext = {},
  children,
  logEnabled = true,
}) => {
  const [context, setContext] = useState<Partial<LogContext>>(initialContext)
  const [isLoggingEnabled, setIsLoggingEnabled] = useState<boolean>(logEnabled)

  useEffect(() => {
    logger.updateDefaultContext(initialContext)
    if (logEnabled) {
      logger.enable()
    } else {
      logger.disable()
    }
  }, [])

  const updateContext = (newContext: Partial<LogContext>) => {
    setContext(prevContext => {
      const updatedContext = { ...prevContext, ...newContext }
      logger.updateDefaultContext(updatedContext)
      return updatedContext
    })
  }

  const log = (event: LogEvent) => {
    logger.log(event, context)
  }

  const logAuth = (
    action: AuthEvent,
    details?: Record<string, any>,
    success: boolean = true,
    level: LogLevel = LogLevel.INFO,
  ) => {
    logger.log(
      {
        category: LogCategory.AUTH,
        action,
        details: details || {},
        success,
        level,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
      },
      context,
    )
  }

  // Логгирование события безопасности
  const logSecurity = (
    action: AuthEvent,
    details?: Record<string, any>,
    success: boolean = true,
    level: LogLevel = LogLevel.IMPORTANT,
  ) => {
    logger.log(
      {
        category: LogCategory.SECURITY,
        action,
        details: details || {},
        success,
        level,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
      },
      context,
    )
  }

  // Логгирование события профиля
  const logProfile = (
    action: AuthEvent,
    details?: Record<string, any>,
    success: boolean = true,
    level: LogLevel = LogLevel.INFO,
  ) => {
    logger.log(
      {
        category: LogCategory.PROFILE,
        action,
        details: details || {},
        success,
        level,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
      },
      context,
    )
  }

  // Включение логгирования
  const enableLogging = () => {
    logger.enable()
    setIsLoggingEnabled(true)
  }

  // Отключение логгирования
  const disableLogging = () => {
    logger.disable()
    setIsLoggingEnabled(false)
  }

  const value: LoggerContextType = {
    logger,
    context,
    updateContext,
    log,
    logAuth,
    logSecurity,
    logProfile,
    enableLogging,
    disableLogging,
    isLoggingEnabled,
  }

  return <LoggerContext.Provider value={value}>{children}</LoggerContext.Provider>
}

export const useLogger = (): LoggerContextType => {
  const context = useContext(LoggerContext)

  if (!context) {
    throw new Error('useLogger must be used within a LoggerProvider')
  }

  return context
}

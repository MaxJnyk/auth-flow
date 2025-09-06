import { useCallback } from 'react'
import { AuthService } from '../../../domain/services/auth.service'
import {
  AuthCredentials,
  AuthResult,
  UserRegistrationData,
} from '../../../domain/models/auth.models'
import { AuthStore } from '../../store/auth-store'
import { useStore } from './use-store'
import { LoggerService } from '../../../logging/services/logger.service'
import { LogLevel, LogCategory, AuthEvent, LogSource } from '../../../logging/models'

export function useAuth(authService: AuthService, authStore: AuthStore, logger?: LoggerService) {
  const { isAuthenticated, isLoading, error } = useStore(authStore)

  const signIn = useCallback(
    async (credentials: AuthCredentials): Promise<AuthResult> => {
      try {
        authStore.setLoading(true)
        const result = await authService.signIn(credentials)

        if (result.isSuccess) {
          authStore.setAuthenticated(true, result.tokens || null)
          // Логируем успешную авторизацию
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.LOGIN_SUCCESS,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: { email: credentials.email },
            success: true,
          })
        } else if (result.error) {
          authStore.setError(result.error)
          // Логируем ошибку авторизации
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.LOGIN_FAILURE,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: { email: credentials.email, error: result.error.message },
            success: false,
          })
        }

        return result
      } catch (error: any) {
        const authError = new Error(error.message || 'Ошибка аутентификации')
        authStore.setError(authError)
        return {
          isSuccess: false,
          error: authError,
        }
      } finally {
        authStore.setLoading(false)
      }
    },
    [authService, authStore],
  )

  const signUp = useCallback(
    async (userData: UserRegistrationData): Promise<AuthResult> => {
      try {
        authStore.setLoading(true)
        const result = await authService.signUp(userData)

        if (result.isSuccess) {
          authStore.setAuthenticated(true, result.tokens || null)
          // Логируем успешную регистрацию
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.REGISTRATION_SUCCESS,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: { email: userData.email },
            success: true,
          })
        } else if (result.error) {
          authStore.setError(result.error)
          // Логируем ошибку регистрации
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.REGISTRATION_FAILURE,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: { email: userData.email, error: result.error.message },
            success: false,
          })
        }

        return result
      } catch (error: any) {
        const authError = new Error(error.message || 'Ошибка регистрации')
        authStore.setError(authError)
        return {
          isSuccess: false,
          error: authError,
        }
      } finally {
        authStore.setLoading(false)
      }
    },
    [authService, authStore],
  )

  const logout = useCallback(async (): Promise<void> => {
    try {
      authStore.setLoading(true)
      await authService.logout()
      // Логируем успешный выход
      logger?.log({
        category: LogCategory.AUTH,
        action: AuthEvent.LOGOUT,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
        details: {},
        success: true,
      })
    } catch (error: any) {
      authStore.setError(new Error(error.message || 'Ошибка при выходе'))
      // Логируем ошибку при выходе
      logger?.log({
        category: LogCategory.AUTH,
        action: AuthEvent.LOGOUT,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
        details: { error: error.message || 'Ошибка при выходе' },
        success: false,
      })
    } finally {
      authStore.setAuthenticated(false, null)
      authStore.setLoading(false)
    }
  }, [authService, authStore, logger])

  const requestPasswordReset = useCallback(
    async (email: string): Promise<void> => {
      try {
        authStore.setLoading(true)
        await authService.requestPasswordReset(email)
        // Логируем успешный запрос сброса пароля
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.PASSWORD_RESET_REQUEST,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: { email },
          success: true,
        })
      } catch (error: any) {
        authStore.setError(new Error(error.message || 'Ошибка при запросе сброса пароля'))
        // Логируем ошибку при запросе сброса пароля
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.PASSWORD_RESET_FAILURE,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: { email, error: error.message },
          success: false,
        })
        throw error
      } finally {
        authStore.setLoading(false)
      }
    },
    [authService, authStore, logger],
  )

  const resetPassword = useCallback(
    async (token: string, newPassword: string): Promise<void> => {
      try {
        authStore.setLoading(true)
        await authService.resetPassword(token, newPassword)
        // Логируем успешный сброс пароля
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.PASSWORD_RESET_SUCCESS,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: { tokenProvided: !!token },
          success: true,
        })
      } catch (error: any) {
        authStore.setError(new Error(error.message || 'Ошибка при сбросе пароля'))
        // Логируем ошибку при сбросе пароля
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.PASSWORD_RESET_FAILURE,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: { tokenProvided: !!token, error: error.message },
          success: false,
        })
        throw error
      } finally {
        authStore.setLoading(false)
      }
    },
    [authService, authStore, logger],
  )

  return {
    signIn,
    signUp,
    logout,
    requestPasswordReset,
    resetPassword,
    isAuthenticated,
    isLoading,
    error,
  }
}

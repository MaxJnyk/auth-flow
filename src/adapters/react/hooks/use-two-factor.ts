import { useCallback } from 'react'
import { TwoFactorService } from '../../../domain/services/two-factor.service'
import { AuthResult, TwoFactorMethod } from '../../../domain/models/auth.models'
import { TwoFactorStore } from '../../store/two-factor-store'
import { useStore } from './use-store'
import { LoggerService } from '../../../logging/services/logger.service'
import { LogLevel, LogCategory, LogSource, AuthEvent } from '../../../logging/models'

export function useTwoFactor(
  twoFactorService: TwoFactorService,
  twoFactorStore: TwoFactorStore,
  logger?: LoggerService,
) {
  const { isRequired, availableMethods, selectedMethod, isLoading, error, setupData } =
    useStore(twoFactorStore)

  const setTwoFactorRequired = useCallback(
    (required: boolean, methods: TwoFactorMethod[] = []): void => {
      twoFactorStore.setRequired(required, methods)

      // Логируем изменение состояния двухфакторной аутентификации
      logger?.log({
        category: LogCategory.AUTH,
        action: required ? AuthEvent.TWO_FACTOR_ENABLE : AuthEvent.TWO_FACTOR_DISABLE,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
        details: {
          required,
          availableMethods: methods.map(m => m.type),
        },
        success: true,
      })
    },
    [twoFactorStore],
  )

  const selectMethod = useCallback(
    (method: TwoFactorMethod): void => {
      twoFactorStore.setSelectedMethod(method)

      // Логируем выбор метода двухфакторной аутентификации
      logger?.log({
        category: LogCategory.AUTH,
        action: AuthEvent.TWO_FACTOR_SETUP,
        level: LogLevel.INFO,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
        details: {
          methodType: method.type,
          methodId: method.id,
        },
        success: true,
      })
    },
    [twoFactorStore],
  )

  const verifyCode = useCallback(
    async (code: string): Promise<AuthResult> => {
      if (!selectedMethod) {
        const noMethodError = new Error('Метод двухфакторной аутентификации не выбран')
        twoFactorStore.setError(noMethodError)
        return {
          isSuccess: false,
          error: noMethodError,
        }
      }

      try {
        twoFactorStore.setLoading(true)
        const result = await twoFactorService.verifyCode(code, selectedMethod)

        if (result.isSuccess) {
          twoFactorStore.reset()

          // Логируем успешную верификацию кода
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.TWO_FACTOR_VERIFY_SUCCESS,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: {
              methodType: selectedMethod.type,
              userId: result.user?.id,
            },
            success: true,
          })
        } else if (result.error) {
          twoFactorStore.setError(result.error)

          // Логируем ошибку верификации кода
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.TWO_FACTOR_VERIFY_FAILURE,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: {
              methodType: selectedMethod.type,
              error: result.error.message,
            },
            success: false,
          })
        }

        return result
      } catch (error: any) {
        const twoFactorError = new Error(error.message || 'Ошибка при проверке кода')
        twoFactorStore.setError(twoFactorError)

        // Логируем ошибку верификации кода
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.TWO_FACTOR_VERIFY_FAILURE,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: {
            methodType: selectedMethod?.type,
            error: error.message || 'Ошибка при проверке кода',
          },
          success: false,
        })

        return {
          isSuccess: false,
          error: twoFactorError,
        }
      } finally {
        twoFactorStore.setLoading(false)
      }
    },
    [twoFactorService, twoFactorStore, selectedMethod],
  )

  const sendCode = useCallback(async (): Promise<void> => {
    if (!selectedMethod) {
      twoFactorStore.setError(new Error('Метод двухфакторной аутентификации не выбран'))
      return
    }

    try {
      twoFactorStore.setLoading(true)
      await twoFactorService.sendCode(selectedMethod)

      // Логируем успешную отправку кода
      logger?.log({
        category: LogCategory.AUTH,
        action: AuthEvent.TWO_FACTOR_SETUP,
        level: LogLevel.INFO,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
        details: {
          methodType: selectedMethod.type,
        },
        success: true,
      })
    } catch (error: any) {
      const sendError = new Error(error.message || 'Ошибка при отправке кода')
      twoFactorStore.setError(sendError)

      // Логируем ошибку отправки кода
      logger?.log({
        category: LogCategory.AUTH,
        action: AuthEvent.TWO_FACTOR_VERIFY_FAILURE,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
        details: {
          methodType: selectedMethod.type,
          error: error.message || 'Ошибка при отправке кода',
        },
        success: false,
      })

      throw error
    } finally {
      twoFactorStore.setLoading(false)
    }
  }, [twoFactorService, twoFactorStore, selectedMethod, logger])

  const getAvailableMethods = useCallback(async (): Promise<TwoFactorMethod[]> => {
    try {
      twoFactorStore.setLoading(true)
      const methods = await twoFactorService.getAvailableMethods()

      // Логируем получение доступных методов
      logger?.log({
        category: LogCategory.AUTH,
        action: AuthEvent.TWO_FACTOR_METHODS_LOADED,
        level: LogLevel.INFO,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
        details: {
          methodsCount: methods.length,
          methodTypes: methods.map(m => m.type),
        },
        success: true,
      })

      return methods
    } catch (error: any) {
      const getMethodsError = new Error(error.message || 'Ошибка при получении доступных методов')
      twoFactorStore.setError(getMethodsError)

      // Логируем ошибку получения методов
      logger?.log({
        category: LogCategory.AUTH,
        action: AuthEvent.TWO_FACTOR_METHODS_LOAD_ERROR,
        level: LogLevel.IMPORTANT,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
        details: {
          error: error.message || 'Ошибка при получении доступных методов',
        },
        success: false,
      })

      return []
    } finally {
      twoFactorStore.setLoading(false)
    }
  }, [twoFactorService, twoFactorStore, logger])

  const setupMethod = useCallback(
    async (method: TwoFactorMethod): Promise<void> => {
      try {
        twoFactorStore.setLoading(true)
        twoFactorStore.setSelectedMethod(method)
        const result = await twoFactorService.setupMethod(method)
        twoFactorStore.setSetupData(result.setupData)

        // Логируем настройку метода
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.TWO_FACTOR_SETUP,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: {
            methodType: method.type,
          },
          success: true,
        })
      } catch (error: any) {
        const setupError = new Error(error.message || 'Ошибка при настройке метода')
        twoFactorStore.setError(setupError)

        // Логируем ошибку настройки метода
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.TWO_FACTOR_VERIFY_FAILURE,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: {
            methodType: method.type,
            error: error.message || 'Ошибка при настройке метода',
          },
          success: false,
        })

        throw error
      } finally {
        twoFactorStore.setLoading(false)
      }
    },
    [twoFactorService, twoFactorStore],
  )

  const confirmMethodSetup = useCallback(
    async (code: string): Promise<void> => {
      if (!selectedMethod) {
        twoFactorStore.setError(new Error('Метод двухфакторной аутентификации не выбран'))
        return
      }

      try {
        twoFactorStore.setLoading(true)
        await twoFactorService.confirmMethodSetup(selectedMethod, code)
        twoFactorStore.setSetupData(null)

        // Логируем успешное подтверждение настройки метода
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.TWO_FACTOR_SETUP,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: {
            methodType: selectedMethod.type,
          },
          success: true,
        })
      } catch (error: any) {
        const confirmError = new Error(error.message || 'Ошибка при подтверждении настройки')
        twoFactorStore.setError(confirmError)

        // Логируем ошибку подтверждения настройки
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.TWO_FACTOR_VERIFY_FAILURE,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: {
            methodType: selectedMethod.type,
            error: error.message || 'Ошибка при подтверждении настройки',
          },
          success: false,
        })

        throw error
      } finally {
        twoFactorStore.setLoading(false)
      }
    },
    [twoFactorService, twoFactorStore, selectedMethod],
  )

  const disableMethod = useCallback(
    async (method: TwoFactorMethod): Promise<void> => {
      try {
        twoFactorStore.setLoading(true)
        await twoFactorService.disableMethod(method)

        // Логируем отключение метода
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.TWO_FACTOR_DISABLE,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: {
            methodType: method.type,
          },
          success: true,
        })
      } catch (error: any) {
        const disableError = new Error(error.message || 'Ошибка при отключении метода')
        twoFactorStore.setError(disableError)

        // Логируем ошибку отключения метода
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.TWO_FACTOR_VERIFY_FAILURE,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: {
            methodType: method.type,
            error: error.message || 'Ошибка при отключении метода',
          },
          success: false,
        })

        throw error
      } finally {
        twoFactorStore.setLoading(false)
      }
    },
    [twoFactorService, twoFactorStore],
  )

  const reset = useCallback(() => {
    twoFactorStore.reset()

    // Логируем сброс состояния двухфакторной аутентификации
    logger?.log({
      category: LogCategory.AUTH,
      action: AuthEvent.TWO_FACTOR_DISABLE,
      level: LogLevel.INFO,
      source: LogSource.FRONTEND,
      timestamp: Date.now(),
      details: {},
      success: true,
    })
  }, [twoFactorStore, logger])

  return {
    isRequired,
    availableMethods,
    selectedMethod,
    isLoading,
    error,
    setupData,
    setTwoFactorRequired,
    selectMethod,
    verifyCode,
    sendCode,
    getAvailableMethods,
    setupMethod,
    confirmMethodSetup,
    disableMethod,
    reset,
  }
}

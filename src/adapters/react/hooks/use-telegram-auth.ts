import { useCallback, useEffect, useState } from 'react'
import { TelegramAuthService } from '../../../domain/services/telegram-auth'
import {
  AuthResult,
  TelegramConfirmOptions,
  TelegramSignInResult,
  TgSignInOptions,
  TwoFactorMethod,
} from '../../../domain/models/auth.models'
import { AuthStore } from '../../store/auth-store'
import { TwoFactorService } from '../../../domain/services/two-factor'
import { LoggerService } from '../../../logging/services/logger.service'
import { LogLevel, LogCategory, LogSource, AuthEvent } from '../../../logging/models'

export interface UseTelegramAuthOptions {
  immediately?: boolean
  isBinding?: boolean
  maxRetries?: number
  pollingInterval?: number
}
export interface TelegramTwoFactorState {
  availableMethods: TwoFactorMethod[]
  confirmMethod: (method: string) => Promise<string>
}

export function useTelegramAuth(
  telegramAuthService: TelegramAuthService,
  authStore: AuthStore,
  twoFactorService?: TwoFactorService,
  options: UseTelegramAuthOptions = {},
  logger?: LoggerService,
) {
  const {
    immediately = false,
    isBinding = false,
    maxRetries = 10,
    pollingInterval = 3000,
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmation, setIsConfirmation] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [linkToBot, setLinkToBot] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [abortController, setAbortController] = useState(() => new AbortController())
  const [isActive, setIsActive] = useState(immediately)
  const [twoFactorState, setTwoFactorState] = useState<TelegramTwoFactorState | null>(null)

  const initSignIn = useCallback(
    async (signInOptions: TgSignInOptions): Promise<TelegramSignInResult> => {
      try {
        setIsLoading(true)
        setError(null)

        // Логируем начало процесса аутентификации через Telegram
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.TELEGRAM_AUTH_INIT,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: {
            isBinding,
            botName: signInOptions.botName,
            redirectUrl: signInOptions.redirectUrl,
          },
          success: true,
        })

        const options = { ...signInOptions, isBinding }
        const result = await telegramAuthService.initSignIn(options)

        setAuthUrl(result.url)
        setSessionId(result.id || null)
        setCode(result.code || null)
        setQr(result.qr || null)
        setLinkToBot(result.linkToBot || null)

        return result
      } catch (error: any) {
        const initError = new Error(
          error.message || 'Ошибка при инициализации входа через Telegram',
        )
        setError(initError)

        // Логируем ошибку инициализации
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.TELEGRAM_AUTH_FAILURE,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: {
            isBinding,
            error: error.message || 'Ошибка при инициализации входа через Telegram',
          },
          success: false,
        })

        throw initError
      } finally {
        setIsLoading(false)
      }
    },
    [telegramAuthService, isBinding, logger],
  )

  const handleAuthResult = useCallback(
    async (data: Record<string, any>): Promise<AuthResult> => {
      try {
        setIsLoading(true)
        setError(null)

        if (!telegramAuthService.validateTelegramData(data)) {
          const validationError = new Error('Невалидные данные аутентификации Telegram')
          setError(validationError)

          // Логируем ошибку валидации
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.TELEGRAM_AUTH_FAILURE,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: {
              error: 'Невалидные данные аутентификации Telegram',
              isBinding,
            },
            success: false,
          })

          return {
            isSuccess: false,
            error: validationError,
          }
        }

        const result = await telegramAuthService.handleAuthResult(data)

        if (result.requiresTwoFactor && result.twoFactorMethods && twoFactorService) {
          // Логируем запрос на двухфакторную аутентификацию
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.TWO_FACTOR_METHODS_LOADED,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: {
              methods: result.twoFactorMethods.map(m => m.type),
              isBinding,
            },
            success: true,
          })

          setTwoFactorState({
            availableMethods: result.twoFactorMethods,
            confirmMethod: async method => {
              const newController = new AbortController()
              setAbortController(newController)

              const confirmResult = await telegramAuthService.confirmAuth({
                id: sessionId || '',
                twoFactorType: method,
                abortSignal: newController.signal,
              })

              if (confirmResult.isSuccess && confirmResult.tokens) {
                authStore.setAuthenticated(true, confirmResult.tokens)
                setIsSuccess(true)
                return confirmResult.id || ''
              } else {
                throw new Error('Не удалось подтвердить двухфакторную аутентификацию')
              }
            },
          })

          return result
        }

        if (result.isSuccess) {
          authStore.setAuthenticated(true, result.tokens || null)
          setIsSuccess(true)

          // Логируем успешную аутентификацию через Telegram
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.TELEGRAM_AUTH_SUCCESS,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: {
              isBinding,
              userId: result.user?.id,
            },
            success: true,
          })
        } else if (result.error) {
          setError(result.error)
        }

        return result
      } catch (error: any) {
        const authError = new Error(error.message || 'Ошибка аутентификации через Telegram')
        setError(authError)
        return {
          isSuccess: false,
          error: authError,
        }
      } finally {
        setIsLoading(false)
      }
    },
    [telegramAuthService, authStore, twoFactorService, sessionId, logger],
  )

  const confirmAuth = useCallback(
    async (options: TelegramConfirmOptions): Promise<AuthResult> => {
      try {
        setIsLoading(true)
        setError(null)
        setIsPolling(true)

        // Логируем начало подтверждения аутентификации
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.TELEGRAM_AUTH_CONFIRM_ATTEMPT,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: {
            sessionId: options.id,
            isBinding,
            twoFactorType: options.twoFactorType,
          },
          success: true,
        })

        const newController = new AbortController()
        setAbortController(newController)
        const confirmOptions: TelegramConfirmOptions = {
          ...options,
          abortSignal: newController.signal,
        }
        const result = await telegramAuthService.confirmAuth(confirmOptions)

        if (result.isSuccess && result.tokens) {
          authStore.setAuthenticated(true, result.tokens)
          setIsSuccess(true)

          // Логируем успешное подтверждение
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.TELEGRAM_AUTH_CONFIRM_SUCCESS,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: {
              sessionId: options.id,
              isBinding,
              userId: result.user?.id,
            },
            success: true,
          })
        } else if (result.error) {
          setError(result.error)
        }

        return result
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Логируем отмену запроса
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.TELEGRAM_AUTH_ABORT,
            level: LogLevel.INFO,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: {
              sessionId: options.id,
              isBinding,
            },
            success: false,
          })

          return {
            isSuccess: false,
            error: new Error('Запрос аутентификации был отменен'),
          }
        }

        const confirmError = new Error(error.message || 'Ошибка при подтверждении аутентификации')
        setError(confirmError)

        // Логируем ошибку подтверждения
        logger?.log({
          category: LogCategory.AUTH,
          action: AuthEvent.TELEGRAM_AUTH_CONFIRM_FAILURE,
          level: LogLevel.IMPORTANT,
          source: LogSource.FRONTEND,
          timestamp: Date.now(),
          details: {
            sessionId: options.id,
            isBinding,
            error: error.message || 'Ошибка при подтверждении аутентификации',
          },
          success: false,
        })

        return {
          isSuccess: false,
          error: confirmError,
        }
      } finally {
        setIsLoading(false)
        setIsPolling(false)
      }
    },
    [telegramAuthService, authStore, abortController, logger, isBinding],
  )

  const handleTelegramMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && 'telegram_auth' in event.data) {
        const telegramData = event.data.telegram_auth
        handleAuthResult(telegramData)
      }
    },
    [handleAuthResult],
  )

  useEffect(() => {
    window.addEventListener('message', handleTelegramMessage)
    return () => {
      window.removeEventListener('message', handleTelegramMessage)
    }
  }, [handleTelegramMessage])

  const openTelegramAuth = useCallback(
    async (signInOptions: TgSignInOptions): Promise<void> => {
      const result = await initSignIn(signInOptions)
      window.open(result.url, 'Telegram Auth', 'width=600,height=600')
    },
    [initSignIn],
  )

  const start = useCallback(() => {
    setIsActive(true)
  }, [])

  useEffect(() => {
    if (!isActive || !sessionId) return

    setIsConfirmation(true)
    let retryCount = maxRetries

    // Логируем начало поллинга
    logger?.log({
      category: LogCategory.AUTH,
      action: AuthEvent.TELEGRAM_AUTH_POLLING_START,
      level: LogLevel.INFO,
      source: LogSource.FRONTEND,
      timestamp: Date.now(),
      details: {
        sessionId,
        isBinding,
        maxRetries,
      },
      success: true,
    })

    const confirmAuthRequest = async () => {
      try {
        setIsPolling(true)
        const result = await telegramAuthService.confirmAuth({
          id: sessionId,
          isBinding,
          abortSignal: abortController.signal,
        })

        if (result.requiresTwoFactor && result.twoFactorMethods && twoFactorService) {
          clearInterval(intervalId)
          setIsConfirmation(false)

          // Логируем запрос на двухфакторную аутентификацию
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.TWO_FACTOR_METHODS_LOADED,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: {
              methods: result.twoFactorMethods.map(m => m.type),
              isBinding,
              sessionId,
            },
            success: true,
          })

          setTwoFactorState({
            availableMethods: result.twoFactorMethods,
            confirmMethod: async method => {
              const newController = new AbortController()
              setAbortController(newController)

              const confirmResult = await telegramAuthService.confirmAuth({
                id: sessionId,
                twoFactorType: method,
                abortSignal: newController.signal,
              })

              if (confirmResult.isSuccess && confirmResult.tokens) {
                authStore.setAuthenticated(true, confirmResult.tokens)
                setIsSuccess(true)
                return confirmResult.id || ''
              } else {
                throw new Error('Не удалось подтвердить двухфакторную аутентификацию')
              }
            },
          })

          return
        }

        if (result.isSuccess && result.tokens) {
          clearInterval(intervalId)
          setIsConfirmation(false)
          authStore.setAuthenticated(true, result.tokens)
          setIsSuccess(true)

          // Логируем успешное завершение поллинга
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.TELEGRAM_AUTH_POLLING_END,
            level: LogLevel.INFO,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: {
              sessionId,
              isBinding,
              result: 'success',
              userId: result.user?.id,
            },
            success: true,
          })
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          clearInterval(intervalId)
          setIsConfirmation(false)
          return
        }

        if (retryCount <= 0) {
          clearInterval(intervalId)
          setIsConfirmation(false)
          setError(new Error('Не удалось подтвердить telegram аккаунт'))

          // Логируем завершение поллинга с ошибкой
          logger?.log({
            category: LogCategory.AUTH,
            action: AuthEvent.TELEGRAM_AUTH_POLLING_END,
            level: LogLevel.IMPORTANT,
            source: LogSource.FRONTEND,
            timestamp: Date.now(),
            details: {
              sessionId,
              isBinding,
              result: 'failure',
              error: 'Не удалось подтвердить telegram аккаунт',
              reason: 'max_retries_exceeded',
            },
            success: false,
          })
        }
      }
    }

    const intervalId = setInterval(() => {
      if (abortController.signal.aborted) {
        clearInterval(intervalId)
        setIsConfirmation(false)
        return
      }

      if (retryCount === 0 && maxRetries !== Infinity) {
        clearInterval(intervalId)
        setIsConfirmation(false)
        setError(new Error('Превышено максимальное количество попыток подтверждения'))
        return
      }

      confirmAuthRequest()
      if (maxRetries !== Infinity) {
        retryCount -= 1
      }
    }, pollingInterval)

    return () => {
      clearInterval(intervalId)
      abortController.abort()
    }
  }, [
    sessionId,
    isActive,
    isBinding,
    maxRetries,
    pollingInterval,
    telegramAuthService,
    twoFactorService,
    authStore,
    abortController,
    logger,
  ])

  const abortAuth = useCallback(() => {
    abortController.abort()
    const newController = new AbortController()
    setAbortController(newController)
    setIsConfirmation(false)
    setIsPolling(false)

    // Логируем отмену аутентификации
    logger?.log({
      category: LogCategory.AUTH,
      action: AuthEvent.TELEGRAM_AUTH_ABORT,
      level: LogLevel.INFO,
      source: LogSource.FRONTEND,
      timestamp: Date.now(),
      details: {
        sessionId: sessionId || undefined,
        isBinding,
        manualAbort: true,
      },
      success: false,
    })
  }, [abortController, logger, sessionId, isBinding])

  return {
    // Методы
    start,
    initSignIn,
    handleAuthResult,
    openTelegramAuth,
    confirmAuth,
    abortAuth,

    // Состояние
    authUrl,
    sessionId,
    code,
    qr,
    linkToBot,
    isLoading,
    isConfirmation,
    isSuccess,
    error,
    isPolling,

    // Двухфакторная аутентификация
    twoFactorState,
  }
}

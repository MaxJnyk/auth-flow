import { describe, it, expect } from 'vitest'
import {
  AuthError,
  AuthErrorType,
  UserError,
  UserErrorType,
  TwoFactorError,
  TwoFactorErrorType,
  handleHttpError,
  handleAuthError,
  localizeError,
} from '../../src/utils/error-handling'

describe('Error Handling Utils', () => {
  describe('Error Classes', () => {
    it('should create AuthError with correct properties', () => {
      const message = 'Authentication failed'
      const type = AuthErrorType.INVALID_CREDENTIALS
      const data = { userId: '123' }

      const error = new AuthError(message, type, data)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AuthError)
      expect(error.name).toBe('AuthError')
      expect(error.message).toBe(message)
      expect(error.type).toBe(type)
      expect(error.data).toBe(data)
    })

    it('should create AuthError with default type when not specified', () => {
      const message = 'Authentication failed'

      const error = new AuthError(message)

      expect(error.type).toBe(AuthErrorType.UNKNOWN_ERROR)
      expect(error.data).toBeUndefined()
    })

    it('should create UserError with correct properties', () => {
      const message = 'Profile update failed'
      const type = UserErrorType.UPDATE_FAILED
      const data = { field: 'email' }

      const error = new UserError(message, type, data)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(UserError)
      expect(error.name).toBe('UserError')
      expect(error.message).toBe(message)
      expect(error.type).toBe(type)
      expect(error.data).toBe(data)
    })

    it('should create TwoFactorError with correct properties', () => {
      const message = 'Invalid code'
      const type = TwoFactorErrorType.INVALID_CODE
      const data = { attempts: 2 }

      const error = new TwoFactorError(message, type, data)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(TwoFactorError)
      expect(error.name).toBe('TwoFactorError')
      expect(error.message).toBe(message)
      expect(error.type).toBe(type)
      expect(error.data).toBe(data)
    })
  })

  describe('handleHttpError', () => {
    it('should handle HTTP 400 error', () => {
      const httpError = {
        response: {
          status: 400,
          data: { message: 'Bad request message' },
        },
      }

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Bad request message')
    })

    it('should handle HTTP 400 error with default message', () => {
      const httpError = {
        response: {
          status: 400,
          data: {},
        },
      }

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Неверный запрос')
    })

    it('should handle HTTP 401 error', () => {
      const httpError = {
        response: {
          status: 401,
          data: {},
        },
      }

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(AuthError)
      expect(error.message).toBe('Не авторизован')
      expect((error as AuthError).type).toBe(AuthErrorType.INVALID_CREDENTIALS)
    })

    it('should handle HTTP 403 error', () => {
      const httpError = {
        response: {
          status: 403,
          data: {},
        },
      }

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(AuthError)
      expect(error.message).toBe('Доступ запрещен')
      expect((error as AuthError).type).toBe(AuthErrorType.ACCOUNT_LOCKED)
    })

    it('should handle HTTP 404 error', () => {
      const httpError = {
        response: {
          status: 404,
          data: {},
        },
      }

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Ресурс не найден')
    })

    it('should handle HTTP 422 error', () => {
      const httpError = {
        response: {
          status: 422,
          data: { message: 'Validation error' },
        },
      }

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Validation error')
    })

    it('should handle HTTP 429 error', () => {
      const httpError = {
        response: {
          status: 429,
          data: {},
        },
      }

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Слишком много запросов')
    })

    it('should handle HTTP 500 error', () => {
      const httpError = {
        response: {
          status: 500,
          data: {},
        },
      }

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Внутренняя ошибка сервера')
    })

    it('should handle other HTTP status codes', () => {
      const httpError = {
        response: {
          status: 503,
          data: {},
        },
      }

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Ошибка HTTP: 503')
    })

    it('should handle network errors', () => {
      const httpError = {
        request: {},
        message: 'Network Error',
      }

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Ошибка сети. Проверьте подключение к интернету.')
    })

    it('should handle other errors', () => {
      const httpError = {
        message: 'Unknown error',
      }

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Unknown error')
    })

    it('should handle errors without message', () => {
      const httpError = {}

      const error = handleHttpError(httpError)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Произошла неизвестная ошибка')
    })
  })

  describe('handleAuthError', () => {
    it('should return AuthError if already an instance', () => {
      const originalError = new AuthError('Original error', AuthErrorType.TOKEN_EXPIRED)

      const error = handleAuthError(originalError)

      expect(error).toBe(originalError)
    })

    it('should handle HTTP 400 error', () => {
      const httpError = {
        response: {
          status: 400,
          data: { message: 'Bad credentials' },
        },
      }

      const error = handleAuthError(httpError)

      expect(error).toBeInstanceOf(AuthError)
      expect(error.message).toBe('Bad credentials')
      expect(error.type).toBe(AuthErrorType.INVALID_CREDENTIALS)
    })

    it('should handle HTTP 401 error with email_not_verified reason', () => {
      const httpError = {
        response: {
          status: 401,
          data: { reason: 'email_not_verified' },
        },
      }

      const error = handleAuthError(httpError)

      expect(error).toBeInstanceOf(AuthError)
      expect(error.message).toBe('Email не подтвержден')
      expect(error.type).toBe(AuthErrorType.EMAIL_NOT_VERIFIED)
    })

    it('should handle HTTP 401 error with two_factor_required reason', () => {
      const twoFactorData = { methods: ['app', 'sms'] }
      const httpError = {
        response: {
          status: 401,
          data: {
            reason: 'two_factor_required',
            ...twoFactorData,
          },
        },
      }

      const error = handleAuthError(httpError)

      expect(error).toBeInstanceOf(AuthError)
      expect(error.message).toBe('Требуется двухфакторная аутентификация')
      expect(error.type).toBe(AuthErrorType.TWO_FACTOR_REQUIRED)
      expect(error.data).toEqual(httpError.response.data)
    })

    it('should handle HTTP 401 error with default reason', () => {
      const httpError = {
        response: {
          status: 401,
          data: {},
        },
      }

      const error = handleAuthError(httpError)

      expect(error).toBeInstanceOf(AuthError)
      expect(error.message).toBe('Неверные учетные данные')
      expect(error.type).toBe(AuthErrorType.INVALID_CREDENTIALS)
    })

    it('should handle HTTP 403 error', () => {
      const httpError = {
        response: {
          status: 403,
          data: {},
        },
      }

      const error = handleAuthError(httpError)

      expect(error).toBeInstanceOf(AuthError)
      expect(error.message).toBe('Аккаунт заблокирован')
      expect(error.type).toBe(AuthErrorType.ACCOUNT_LOCKED)
    })

    it('should handle HTTP 429 error', () => {
      const httpError = {
        response: {
          status: 429,
          data: {},
        },
      }

      const error = handleAuthError(httpError)

      expect(error).toBeInstanceOf(AuthError)
      expect(error.message).toBe('Слишком много попыток входа')
      expect(error.type).toBe(AuthErrorType.UNKNOWN_ERROR)
    })

    it('should handle HTTP 500 error', () => {
      const httpError = {
        response: {
          status: 500,
          data: {},
        },
      }

      const error = handleAuthError(httpError)

      expect(error).toBeInstanceOf(AuthError)
      expect(error.message).toBe('Ошибка сервера аутентификации')
      expect(error.type).toBe(AuthErrorType.SERVER_ERROR)
    })

    it('should handle network errors', () => {
      const httpError = {
        request: {},
        message: 'Network Error',
      }

      const error = handleAuthError(httpError)

      expect(error).toBeInstanceOf(AuthError)
      expect(error.message).toBe('Ошибка сети при аутентификации')
      expect(error.type).toBe(AuthErrorType.NETWORK_ERROR)
    })

    it('should handle other errors', () => {
      const httpError = {
        message: 'Unknown error',
      }

      const error = handleAuthError(httpError)

      expect(error).toBeInstanceOf(AuthError)
      expect(error.message).toBe('Unknown error')
      expect(error.type).toBe(AuthErrorType.UNKNOWN_ERROR)
    })
  })

  describe('localizeError', () => {
    it('should localize AuthError in Russian', () => {
      const error = new AuthError('Original message', AuthErrorType.INVALID_CREDENTIALS)

      const message = localizeError(error, 'ru')

      expect(message).toBe('Неверный email или пароль')
    })

    it('should localize AuthError in English', () => {
      const error = new AuthError('Original message', AuthErrorType.INVALID_CREDENTIALS)

      const message = localizeError(error, 'en')

      expect(message).toBe('Invalid email or password')
    })

    it('should localize UserError in Russian', () => {
      const error = new UserError('Original message', UserErrorType.PROFILE_NOT_FOUND)

      const message = localizeError(error, 'ru')

      expect(message).toBe('Профиль пользователя не найден')
    })

    it('should localize UserError in English', () => {
      const error = new UserError('Original message', UserErrorType.PROFILE_NOT_FOUND)

      const message = localizeError(error, 'en')

      expect(message).toBe('User profile not found')
    })

    it('should localize TwoFactorError in Russian', () => {
      const error = new TwoFactorError('Original message', TwoFactorErrorType.INVALID_CODE)

      const message = localizeError(error, 'ru')

      expect(message).toBe('Неверный код подтверждения')
    })

    it('should localize TwoFactorError in English', () => {
      const error = new TwoFactorError('Original message', TwoFactorErrorType.INVALID_CODE)

      const message = localizeError(error, 'en')

      expect(message).toBe('Invalid verification code')
    })

    it('should return original message for regular Error', () => {
      const error = new Error('Regular error message')

      const message = localizeError(error)

      expect(message).toBe('Regular error message')
    })

    it('should use Russian as default locale', () => {
      const error = new AuthError('Original message', AuthErrorType.ACCOUNT_LOCKED)

      const message = localizeError(error) // без указания локали

      expect(message).toBe('Аккаунт заблокирован. Пожалуйста, обратитесь в службу поддержки')
    })

    it('should return original message for unknown error types', () => {
      const error = new AuthError('Custom error message', 'CUSTOM_TYPE' as any)

      const message = localizeError(error)

      expect(message).toBe('Custom error message')
    })
  })
})

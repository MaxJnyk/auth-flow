import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiAuthService } from '../../../src/infrastructure/services/api-auth.service'
import { HttpClient } from '../../../src/infrastructure/http/http-client.interface'
import { TokenStorage } from '../../../src/infrastructure/storage/token-storage.interface'
import { LoggerService } from '../../../src/logging/services/logger.service'
import { AuthCredentials, UserRegistrationData } from '../../../src/domain/models/auth.models'

describe('ApiAuthService', () => {
  let httpClientMock: Partial<HttpClient>
  let tokenStorageMock: Partial<TokenStorage>
  let loggerMock: Partial<LoggerService>
  let authService: ApiAuthService
  let config: {
    apiBaseUrl: string
    endpoints: {
      signIn: string
      signUp: string
      refreshToken: string
      logout: string
      passwordReset: { request: string; confirm: string }
    }
  }

  beforeEach(() => {
    httpClientMock = {
      setBaseUrl: vi.fn(),
      setErrorInterceptor: vi.fn(),
      post: vi.fn(),
    }

    tokenStorageMock = {
      saveTokens: vi.fn(),
      getAccessToken: vi.fn(),
      getRefreshToken: vi.fn(),
      clearTokens: vi.fn(),
      isAccessTokenExpired: vi.fn(),
    }

    loggerMock = {
      log: vi.fn(),
    }

    config = {
      apiBaseUrl: 'https://api.example.com',
      endpoints: {
        signIn: '/auth/signin',
        signUp: '/auth/signup',
        refreshToken: '/auth/refresh',
        logout: '/auth/logout',
        passwordReset: {
          request: '/auth/password-reset/request',
          confirm: '/auth/password-reset/confirm',
        },
      },
    }

    authService = new ApiAuthService(
      httpClientMock as HttpClient,
      tokenStorageMock as TokenStorage,
      config,
      loggerMock as LoggerService,
    )
  })

  describe('constructor', () => {
    it('должен настраивать базовый URL и перехватчик ошибок', () => {
      expect(httpClientMock.setBaseUrl).toHaveBeenCalledWith(config.apiBaseUrl)
      expect(httpClientMock.setErrorInterceptor).toHaveBeenCalled()
    })
  })

  describe('error interceptor', () => {
    it('должен обновлять токен при ошибке 401', async () => {
      const error = {
        response: { status: 401 },
      }
      const newTokens = { accessToken: 'new-token', refreshToken: 'new-refresh', expiresIn: 3600 }

      tokenStorageMock.getRefreshToken = vi.fn().mockReturnValue('old-refresh')
      httpClientMock.post = vi.fn().mockResolvedValue({ tokens: newTokens })

      const interceptor = (httpClientMock.setErrorInterceptor as any).mock.calls[0][0]
      await interceptor(error)

      expect(httpClientMock.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh',
      })
      expect(tokenStorageMock.saveTokens).toHaveBeenCalledWith(newTokens)
    })

    it('должен выходить из системы, если нет refresh токена', async () => {
      const error = {
        response: { status: 401 },
      }

      tokenStorageMock.getRefreshToken = vi.fn().mockReturnValue(null)

      const interceptor = (httpClientMock.setErrorInterceptor as any).mock.calls[0][0]
      await interceptor(error)

      expect(tokenStorageMock.clearTokens).toHaveBeenCalled()
    })

    it('должен выходить из системы при ошибке обновления токена', async () => {
      const error = {
        response: { status: 401 },
      }

      tokenStorageMock.getRefreshToken = vi.fn().mockReturnValue('old-refresh')
      httpClientMock.post = vi.fn().mockRejectedValue(new Error('Refresh failed'))

      const interceptor = (httpClientMock.setErrorInterceptor as any).mock.calls[0][0]
      await interceptor(error)

      expect(tokenStorageMock.clearTokens).toHaveBeenCalled()
    })
  })

  describe('signIn', () => {
    it('должен успешно авторизовать пользователя', async () => {
      const credentials: AuthCredentials = { email: 'test@test.com', password: 'password' }
      const mockResponse = {
        tokens: { accessToken: 'token', refreshToken: 'refresh', expiresIn: 3600 },
        user: { id: '1', email: 'test@test.com' },
      }

      httpClientMock.post = vi.fn().mockResolvedValue(mockResponse)

      const result = await authService.signIn(credentials)

      expect(httpClientMock.post).toHaveBeenCalledWith('/auth/signin', credentials)
      expect(tokenStorageMock.saveTokens).toHaveBeenCalledWith(mockResponse.tokens)
      expect(result.isSuccess).toBe(true)
      expect(result.tokens).toEqual(mockResponse.tokens)
      expect(result.user).toEqual(mockResponse.user)
    })

    it('должен обрабатывать требование двухфакторной аутентификации', async () => {
      const credentials: AuthCredentials = { email: 'test@test.com', password: 'password' }
      const mockResponse = {
        requiresTwoFactor: true,
        twoFactorMethods: [{ id: 'sms', type: 'sms', isAvailable: true, isConfigured: true }],
      }

      httpClientMock.post = vi.fn().mockResolvedValue(mockResponse)

      const result = await authService.signIn(credentials)

      expect(result.isSuccess).toBe(false)
      expect(result.requiresTwoFactor).toBe(true)
      expect(result.twoFactorMethods).toEqual(mockResponse.twoFactorMethods)
    })

    it('должен обрабатывать ошибки авторизации', async () => {
      const credentials: AuthCredentials = { email: 'test@test.com', password: 'wrong' }
      httpClientMock.post = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

      const result = await authService.signIn(credentials)

      expect(result.isSuccess).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Invalid credentials')
    })
  })

  describe('signUp', () => {
    it('должен успешно регистрировать пользователя', async () => {
      const userData: UserRegistrationData = {
        email: 'test@test.com',
        password: 'password',
        firstName: 'Test',
      }
      const mockResponse = {
        tokens: { accessToken: 'token', refreshToken: 'refresh', expiresIn: 3600 },
        user: { id: '1', email: 'test@test.com', firstName: 'Test' },
      }

      httpClientMock.post = vi.fn().mockResolvedValue(mockResponse)

      const result = await authService.signUp(userData)

      expect(httpClientMock.post).toHaveBeenCalledWith('/auth/signup', userData)
      expect(tokenStorageMock.saveTokens).toHaveBeenCalledWith(mockResponse.tokens)
      expect(result.isSuccess).toBe(true)
    })

    it('должен обрабатывать ошибки регистрации', async () => {
      const userData: UserRegistrationData = { email: 'test@test.com', password: 'password' }
      httpClientMock.post = vi.fn().mockRejectedValue(new Error('Email already exists'))

      const result = await authService.signUp(userData)

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Email already exists')
    })
  })

  describe('logout', () => {
    it('должен успешно выходить из системы с refresh токеном', async () => {
      tokenStorageMock.getRefreshToken = vi.fn().mockReturnValue('refresh-token')
      httpClientMock.post = vi.fn().mockResolvedValue({})

      await authService.logout()

      expect(httpClientMock.post).toHaveBeenCalledWith('/auth/logout', {
        refreshToken: 'refresh-token',
      })
      expect(tokenStorageMock.clearTokens).toHaveBeenCalled()
    })

    it('должен очищать токены даже при ошибке API', async () => {
      tokenStorageMock.getRefreshToken = vi.fn().mockReturnValue('refresh-token')
      httpClientMock.post = vi.fn().mockRejectedValue(new Error('Server error'))

      await authService.logout()

      expect(tokenStorageMock.clearTokens).toHaveBeenCalled()
      expect(loggerMock.log).toHaveBeenCalled()
    })

    it('должен очищать токены без API вызова, если нет refresh токена', async () => {
      tokenStorageMock.getRefreshToken = vi.fn().mockReturnValue(null)

      await authService.logout()

      expect(httpClientMock.post).not.toHaveBeenCalled()
      expect(tokenStorageMock.clearTokens).toHaveBeenCalled()
    })
  })

  describe('isAuthenticated', () => {
    it('должен возвращать true для валидного токена', () => {
      tokenStorageMock.getAccessToken = vi.fn().mockReturnValue('valid-token')
      tokenStorageMock.isAccessTokenExpired = vi.fn().mockReturnValue(false)

      const result = authService.isAuthenticated()

      expect(result).toBe(true)
    })

    it('должен возвращать false для истекшего токена', () => {
      tokenStorageMock.getAccessToken = vi.fn().mockReturnValue('expired-token')
      tokenStorageMock.isAccessTokenExpired = vi.fn().mockReturnValue(true)

      const result = authService.isAuthenticated()

      expect(result).toBe(false)
    })

    it('должен возвращать false при отсутствии токена', () => {
      tokenStorageMock.getAccessToken = vi.fn().mockReturnValue(null)

      const result = authService.isAuthenticated()

      expect(result).toBe(false)
    })
  })

  describe('refreshToken', () => {
    it('должен обновлять токены', async () => {
      const newTokens = { accessToken: 'new-token', refreshToken: 'new-refresh', expiresIn: 3600 }
      httpClientMock.post = vi.fn().mockResolvedValue({ tokens: newTokens })

      const result = await authService.refreshToken('old-refresh-token')

      expect(httpClientMock.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      })
      expect(tokenStorageMock.saveTokens).toHaveBeenCalledWith(newTokens)
      expect(result).toEqual(newTokens)
    })
  })

  describe('requestPasswordReset', () => {
    it('должен отправлять запрос на сброс пароля', async () => {
      httpClientMock.post = vi.fn().mockResolvedValue({})

      await authService.requestPasswordReset('test@test.com')

      expect(httpClientMock.post).toHaveBeenCalledWith('/auth/password-reset/request', {
        email: 'test@test.com',
      })
    })
  })

  describe('resetPassword', () => {
    it('должен сбрасывать пароль', async () => {
      httpClientMock.post = vi.fn().mockResolvedValue({})

      await authService.resetPassword('reset-token', 'new-password')

      expect(httpClientMock.post).toHaveBeenCalledWith('/auth/password-reset/confirm', {
        token: 'reset-token',
        password: 'new-password',
      })
    })
  })
})

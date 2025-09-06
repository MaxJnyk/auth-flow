import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ApiTwoFactorService,
  ApiTwoFactorServiceConfig,
} from '../../../src/infrastructure/services/api-two-factor.service'
import { HttpClient } from '../../../src/infrastructure/http/http-client.interface'
import { TokenStorage } from '../../../src/infrastructure/storage/token-storage.interface'
import {
  AuthResult,
  AuthTokens,
  TwoFactorMethod,
  TwoFactorMethodType,
} from '../../../src/domain/models/auth.models'

describe('ApiTwoFactorService', () => {
  let twoFactorService: ApiTwoFactorService
  let mockHttpClient: HttpClient
  let mockTokenStorage: TokenStorage
  let config: ApiTwoFactorServiceConfig

  const mockTokens: AuthTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  }

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  beforeEach(() => {
    // моки для зависимостей
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      setBaseUrl: vi.fn(),
      setHeader: vi.fn(),
      setHeaders: vi.fn(),
      removeHeader: vi.fn(),
      setInterceptor: vi.fn(),
    }

    mockTokenStorage = {
      getAccessToken: vi.fn(),
      getRefreshToken: vi.fn(),
      saveTokens: vi.fn(),
      clearTokens: vi.fn(),
      isAccessTokenExpired: vi.fn(),
      isRefreshTokenExpired: vi.fn(),
    }

    // Конфигурация для ApiTwoFactorService
    config = {
      apiBaseUrl: 'https://api.example.com',
      endpoints: {
        verify: '/auth/2fa/verify',
        send: '/auth/2fa/send',
        methods: '/auth/2fa/methods',
        setup: '/auth/2fa/setup',
        confirm: '/auth/2fa/confirm',
        disable: '/auth/2fa/disable',
      },
    }

    twoFactorService = new ApiTwoFactorService(mockHttpClient, mockTokenStorage, config)
  })

  describe('verifyCode', () => {
    it('should verify 2FA code successfully and save tokens', async () => {
      const code = '123456'
      const method: TwoFactorMethod = {
        id: 'app-method-id',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: true,
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue({
        tokens: mockTokens,
        user: mockUser,
      })

      const result = await twoFactorService.verifyCode(code, method)

      expect(result).toEqual({
        isSuccess: true,
        tokens: mockTokens,
        user: mockUser,
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.verify, { code, method })

      expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(mockTokens)
    })

    it('should handle verification failure', async () => {
      const code = 'invalid-code'
      const method: TwoFactorMethod = {
        id: 'app-method-id',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: true,
      }
      const errorMessage = 'Invalid verification code'

      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error(errorMessage))

      const result = await twoFactorService.verifyCode(code, method)

      expect(result).toEqual({
        isSuccess: false,
        error: new Error(errorMessage),
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.verify, { code, method })

      expect(mockTokenStorage.saveTokens).not.toHaveBeenCalled()
    })

    it('should handle verification failure with default error message', async () => {
      const code = 'invalid-code'
      const method: TwoFactorMethod = {
        id: 'app-method-id',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: true,
      }

      vi.mocked(mockHttpClient.post).mockRejectedValue({})
      const result = await twoFactorService.verifyCode(code, method)

      expect(result).toEqual({
        isSuccess: false,
        error: new Error('Ошибка проверки кода двухфакторной аутентификации'),
      })
    })
  })

  describe('sendCode', () => {
    it('should send 2FA code successfully', async () => {
      const method: TwoFactorMethod = {
        id: 'sms-method-id',
        type: TwoFactorMethodType.SMS,
        isAvailable: true,
        isConfigured: true,
      }
      vi.mocked(mockHttpClient.post).mockResolvedValue({})

      await twoFactorService.sendCode(method)

      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.send, { method })
    })

    it('should throw error if sending code fails', async () => {
      const method: TwoFactorMethod = {
        id: 'sms-method-id',
        type: TwoFactorMethodType.SMS,
        isAvailable: true,
        isConfigured: true,
      }
      const errorMessage = 'Failed to send code'
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error(errorMessage))

      await expect(twoFactorService.sendCode(method)).rejects.toThrow(errorMessage)
      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.send, { method })
    })
  })

  describe('getAvailableMethods', () => {
    it('should return available 2FA methods', async () => {
      const availableMethods: TwoFactorMethod[] = [
        {
          id: 'app-method-id',
          type: TwoFactorMethodType.TOTP,
          isAvailable: true,
          isConfigured: true,
        },
        {
          id: 'sms-method-id',
          type: TwoFactorMethodType.SMS,
          isAvailable: true,
          isConfigured: true,
        },
      ]
      vi.mocked(mockHttpClient.get).mockResolvedValue({ methods: availableMethods })

      const result = await twoFactorService.getAvailableMethods()

      expect(result).toEqual(availableMethods)
      expect(mockHttpClient.get).toHaveBeenCalledWith(config.endpoints.methods)
    })

    it('should throw error if fetching methods fails', async () => {
      const errorMessage = 'Failed to fetch methods'
      vi.mocked(mockHttpClient.get).mockRejectedValue(new Error(errorMessage))

      await expect(twoFactorService.getAvailableMethods()).rejects.toThrow(errorMessage)
      expect(mockHttpClient.get).toHaveBeenCalledWith(config.endpoints.methods)
    })
  })

  describe('setupMethod', () => {
    it('should setup 2FA method successfully', async () => {
      const method: TwoFactorMethod = {
        id: 'app-method-id',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: true,
      }
      const setupData = {
        qrCode: 'data:image/png;base64,abc123',
        secret: 'ABCDEFGHIJKLMNOP',
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue({ setupData })

      const result = await twoFactorService.setupMethod(method)

      expect(result).toEqual({ setupData })
      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.setup, { method })
    })

    it('should throw error if setup fails', async () => {
      const method: TwoFactorMethod = {
        id: 'app-method-id',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: true,
      }
      const errorMessage = 'Failed to setup method'
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error(errorMessage))

      await expect(twoFactorService.setupMethod(method)).rejects.toThrow(errorMessage)
      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.setup, { method })
    })
  })

  describe('confirmMethodSetup', () => {
    it('should confirm 2FA method setup successfully', async () => {
      const method: TwoFactorMethod = {
        id: 'app-method-id',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: true,
      }
      const code = '123456'
      vi.mocked(mockHttpClient.post).mockResolvedValue({})

      await twoFactorService.confirmMethodSetup(method, code)

      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.confirm, { method, code })
    })

    it('should throw error if confirmation fails', async () => {
      const method: TwoFactorMethod = {
        id: 'app-method-id',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: true,
      }
      const code = 'invalid-code'
      const errorMessage = 'Invalid verification code'
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error(errorMessage))

      await expect(twoFactorService.confirmMethodSetup(method, code)).rejects.toThrow(errorMessage)
      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.confirm, { method, code })
    })
  })

  describe('disableMethod', () => {
    it('should disable 2FA method successfully', async () => {
      const method: TwoFactorMethod = {
        id: 'app-method-id',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: true,
      }
      vi.mocked(mockHttpClient.post).mockResolvedValue({})

      await twoFactorService.disableMethod(method)

      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.disable, { method })
    })

    it('should throw error if disabling method fails', async () => {
      const method: TwoFactorMethod = {
        id: 'app-method-id',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: true,
      }
      const errorMessage = 'Failed to disable method'
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error(errorMessage))

      await expect(twoFactorService.disableMethod(method)).rejects.toThrow(errorMessage)
      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.disable, { method })
    })
  })
})

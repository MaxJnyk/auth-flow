import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiTwoFactorService } from '../../../src/infrastructure/services/api-two-factor.service'
import { HttpClient } from '../../../src/infrastructure/http/http-client.interface'
import { TokenStorage } from '../../../src/infrastructure/storage/token-storage.interface'
import {
  TwoFactorMethod,
  TwoFactorMethodType,
  AuthTokens,
  UserProfile,
} from '../../../src/domain/models/auth.models'

describe('ApiTwoFactorService', () => {
  let httpClientMock: Partial<HttpClient>
  let tokenStorageMock: Partial<TokenStorage>
  let twoFactorService: ApiTwoFactorService
  let config: {
    apiBaseUrl: string
    endpoints: {
      verify: string
      send: string
      methods: string
      setup: string
      confirm: string
      disable: string
    }
  }

  beforeEach(() => {
    httpClientMock = {
      setBaseUrl: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    }

    tokenStorageMock = {
      saveTokens: vi.fn(),
    }

    config = {
      apiBaseUrl: 'https://api.test.com',
      endpoints: {
        verify: '/2fa/verify',
        send: '/2fa/send',
        methods: '/2fa/methods',
        setup: '/2fa/setup',
        confirm: '/2fa/confirm',
        disable: '/2fa/disable',
      },
    }

    twoFactorService = new ApiTwoFactorService(
      httpClientMock as HttpClient,
      tokenStorageMock as TokenStorage,
      config,
    )
  })

  describe('constructor', () => {
    it('должен настраивать базовый URL', () => {
      expect(httpClientMock.setBaseUrl).toHaveBeenCalledWith(config.apiBaseUrl)
    })
  })

  describe('verifyCode', () => {
    const method: TwoFactorMethod = {
      id: 'sms',
      type: TwoFactorMethodType.SMS,
      isAvailable: true,
      isConfigured: true,
    }

    it('должен успешно верифицировать код', async () => {
      const mockTokens: AuthTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      }
      const mockUser: UserProfile = {
        id: '1',
        email: 'test@test.com',
      }

      httpClientMock.post = vi.fn().mockResolvedValue({
        tokens: mockTokens,
        user: mockUser,
      })

      const result = await twoFactorService.verifyCode('123456', method)

      expect(httpClientMock.post).toHaveBeenCalledWith('/2fa/verify', {
        code: '123456',
        method,
      })
      expect(tokenStorageMock.saveTokens).toHaveBeenCalledWith(mockTokens)
      expect(result.isSuccess).toBe(true)
      expect(result.tokens).toEqual(mockTokens)
      expect(result.user).toEqual(mockUser)
    })

    it('должен обрабатывать ошибки верификации', async () => {
      httpClientMock.post = vi.fn().mockRejectedValue(new Error('Invalid code'))

      const result = await twoFactorService.verifyCode('wrong', method)

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Invalid code')
    })

    it('должен обрабатывать неизвестные ошибки', async () => {
      httpClientMock.post = vi.fn().mockRejectedValue('Unknown error')

      const result = await twoFactorService.verifyCode('123456', method)

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Ошибка проверки кода двухфакторной аутентификации')
    })
  })

  describe('sendCode', () => {
    it('должен отправлять код', async () => {
      const method: TwoFactorMethod = {
        id: 'sms',
        type: TwoFactorMethodType.SMS,
        isAvailable: true,
        isConfigured: true,
      }

      httpClientMock.post = vi.fn().mockResolvedValue({})

      await twoFactorService.sendCode(method)

      expect(httpClientMock.post).toHaveBeenCalledWith('/2fa/send', { method })
    })
  })

  describe('getAvailableMethods', () => {
    it('должен получать доступные методы', async () => {
      const mockMethods: TwoFactorMethod[] = [
        {
          id: 'sms',
          type: TwoFactorMethodType.SMS,
          isAvailable: true,
          isConfigured: true,
        },
        {
          id: 'email',
          type: TwoFactorMethodType.EMAIL,
          isAvailable: true,
          isConfigured: false,
        },
      ]

      httpClientMock.get = vi.fn().mockResolvedValue({ methods: mockMethods })

      const result = await twoFactorService.getAvailableMethods()

      expect(httpClientMock.get).toHaveBeenCalledWith('/2fa/methods')
      expect(result).toEqual(mockMethods)
    })
  })

  describe('setupMethod', () => {
    it('должен настраивать метод', async () => {
      const method: TwoFactorMethod = {
        id: 'totp',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: false,
      }

      const mockSetupResponse = {
        setupData: {
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          secret: 'JBSWY3DPEHPK3PXP',
        },
      }

      httpClientMock.post = vi.fn().mockResolvedValue(mockSetupResponse)

      const result = await twoFactorService.setupMethod(method)

      expect(httpClientMock.post).toHaveBeenCalledWith('/2fa/setup', { method })
      expect(result).toEqual(mockSetupResponse)
    })
  })

  describe('confirmMethodSetup', () => {
    it('должен подтверждать настройку метода', async () => {
      const method: TwoFactorMethod = {
        id: 'totp',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: false,
      }

      httpClientMock.post = vi.fn().mockResolvedValue({})

      await twoFactorService.confirmMethodSetup(method, '123456')

      expect(httpClientMock.post).toHaveBeenCalledWith('/2fa/confirm', {
        method,
        code: '123456',
      })
    })
  })

  describe('disableMethod', () => {
    it('должен отключать метод', async () => {
      const method: TwoFactorMethod = {
        id: 'sms',
        type: TwoFactorMethodType.SMS,
        isAvailable: true,
        isConfigured: true,
      }

      httpClientMock.post = vi.fn().mockResolvedValue({})

      await twoFactorService.disableMethod(method)

      expect(httpClientMock.post).toHaveBeenCalledWith('/2fa/disable', { method })
    })
  })
})

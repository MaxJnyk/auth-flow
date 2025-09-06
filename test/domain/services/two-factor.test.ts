/**
 * Тесты для TwoFactor сервиса
 * @module test/domain/services/two-factor.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TwoFactor } from '../../../src/domain/services/two-factor'
import { ApiClient } from '../../../src/adapters/api/api-client.interface'
import { AuthConfig } from '../../../src/config/auth-config'
import { LoggerService } from '../../../src/logging/logger.service'
import {
  TelegramAuthAdapter,
  TelegramUserData,
} from '../../../src/adapters/telegram/telegram-auth.adapter'
import { TwoFactorMethod, TwoFactorMethodType } from '../../../src/domain/models/auth.models'

describe('TwoFactor Service', () => {
  let apiClientMock: Partial<ApiClient>
  let configMock: AuthConfig
  let loggerMock: Partial<LoggerService>
  let telegramAdapterMock: Partial<TelegramAuthAdapter>
  let service: TwoFactor

  beforeEach(() => {
    apiClientMock = {
      post: vi.fn(),
      get: vi.fn(),
    }
    configMock = {
      api: { twoFactorEndpoint: '/2fa' },
    } as AuthConfig
    loggerMock = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }
    telegramAdapterMock = {
      initialize: vi.fn(),
      authenticate: vi.fn(),
      createLoginWidget: vi.fn(),
    }
    service = new TwoFactor(
      apiClientMock as ApiClient,
      configMock,
      loggerMock as LoggerService,
      telegramAdapterMock as TelegramAuthAdapter,
    )
    vi.clearAllMocks()
  })

  describe('initialize', () => {
    it('должен успешно инициализироваться с Telegram адаптером', async () => {
      await service.initialize()
      expect(telegramAdapterMock.initialize).toHaveBeenCalled()
      expect(loggerMock.info).toHaveBeenCalled()
    })

    it('должен обрабатывать ошибку инициализации Telegram адаптера', async () => {
      vi.mocked(telegramAdapterMock.initialize!).mockRejectedValue(new Error('Init failed'))
      await expect(service.initialize()).rejects.toThrow('Init failed')
      expect(loggerMock.error).toHaveBeenCalled()
    })
  })

  describe('verifyCode', () => {
    it('должен вызывать API для стандартных методов', async () => {
      const method: TwoFactorMethod = {
        id: '1',
        type: TwoFactorMethodType.SMS,
        isAvailable: true,
        isConfigured: true,
      }
      const mockResponse = { isSuccess: true }
      vi.mocked(apiClientMock.post!).mockResolvedValue(mockResponse)

      const result = await service.verifyCode('123456', method)

      expect(apiClientMock.post).toHaveBeenCalledWith('/2fa/verify', expect.any(Object))
      expect(result).toEqual(mockResponse)
    })

    it('должен использовать Telegram адаптер для Telegram метода', async () => {
      const method: TwoFactorMethod = {
        id: '1',
        type: TwoFactorMethodType.TELEGRAM,
        isAvailable: true,
        isConfigured: true,
      }
      const mockUserData: TelegramUserData = {
        id: 12345,
        firstName: 'Test',
        authDate: Date.now() / 1000,
        hash: 'test-hash',
      }
      const mockResponse = {
        isSuccess: true,
        userData: mockUserData,
      }
      vi.mocked(telegramAdapterMock.authenticate!).mockResolvedValue(mockResponse)
      vi.mocked(apiClientMock.post!).mockResolvedValue({ isSuccess: true })

      await service.verifyCode('123456', method)

      expect(telegramAdapterMock.authenticate).toHaveBeenCalled()
      expect(apiClientMock.post).toHaveBeenCalledWith('/2fa/verify/telegram', expect.any(Object))
    })

    it('должен обрабатывать ошибку от Telegram адаптера', async () => {
      const method: TwoFactorMethod = {
        id: '1',
        type: TwoFactorMethodType.TELEGRAM,
        isAvailable: true,
        isConfigured: true,
      }
      vi.mocked(telegramAdapterMock.authenticate!).mockResolvedValue({
        isSuccess: false,
        error: new Error('Telegram auth failed'),
      })

      const result = await service.verifyCode('123456', method)

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Telegram auth failed')
    })
  })

  describe('sendCode', () => {
    it('должен вызывать API для стандартных методов', async () => {
      const method: TwoFactorMethod = {
        id: '1',
        type: TwoFactorMethodType.SMS,
        isAvailable: true,
        isConfigured: true,
      }
      await service.sendCode(method)
      expect(apiClientMock.post).toHaveBeenCalledWith('/2fa/send', expect.any(Object))
    })

    it('должен использовать Telegram адаптер для Telegram метода', async () => {
      const method: TwoFactorMethod = {
        id: '1',
        type: TwoFactorMethodType.TELEGRAM,
        isAvailable: true,
        isConfigured: true,
      }
      await service.sendCode(method)
      expect(telegramAdapterMock.createLoginWidget).toHaveBeenCalled()
    })
  })

  describe('getAvailableMethods', () => {
    it('должен получать доступные методы из API', async () => {
      const mockMethods = [
        { id: '1', type: TwoFactorMethodType.SMS, isAvailable: true, isConfigured: true },
      ]
      vi.mocked(apiClientMock.get!).mockResolvedValue(mockMethods)

      const result = await service.getAvailableMethods()

      expect(apiClientMock.get).toHaveBeenCalledWith('/2fa/methods')
      expect(result).toEqual(mockMethods)
    })

    it('должен возвращать пустой массив при ошибке API', async () => {
      vi.mocked(apiClientMock.get!).mockRejectedValue(new Error('API Error'))
      const result = await service.getAvailableMethods()
      expect(result).toEqual([])
      expect(loggerMock.error).toHaveBeenCalled()
    })
  })

  describe('setupMethod', () => {
    it('должен вызывать API для стандартных методов', async () => {
      const method: TwoFactorMethod = {
        id: '1',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: false,
      }
      const mockResponse = { setupData: { qrCode: 'qr' } }
      vi.mocked(apiClientMock.post!).mockResolvedValue(mockResponse)

      const result = await service.setupMethod(method)

      expect(apiClientMock.post).toHaveBeenCalledWith('/2fa/setup', expect.any(Object))
      expect(result).toEqual(mockResponse)
    })
  })

  describe('confirmMethodSetup', () => {
    it('должен вызывать API для стандартных методов', async () => {
      const method: TwoFactorMethod = {
        id: '1',
        type: TwoFactorMethodType.TOTP,
        isAvailable: true,
        isConfigured: false,
      }
      await service.confirmMethodSetup(method, '123456')
      expect(apiClientMock.post).toHaveBeenCalledWith('/2fa/confirm', expect.any(Object))
    })
  })

  describe('disableMethod', () => {
    it('должен вызывать API для отключения метода', async () => {
      const method: TwoFactorMethod = {
        id: '1',
        type: TwoFactorMethodType.SMS,
        isAvailable: true,
        isConfigured: true,
      }
      await service.disableMethod(method)
      expect(apiClientMock.post).toHaveBeenCalledWith('/2fa/disable', expect.any(Object))
    })
  })
})

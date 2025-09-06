import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TelegramTwoFactorAdapter } from '../../../src/adapters/telegram/telegram-two-factor.adapter'
import { TelegramAuthAdapter } from '../../../src/adapters/telegram/telegram-auth.adapter'
import { LoggerService } from '../../../src/logging/logger.service'
import { TwoFactorMethodType } from '../../../src/domain/models/auth.models'

describe('TelegramTwoFactorAdapter', () => {
  let authAdapterMock: Partial<TelegramAuthAdapter>
  let loggerMock: Partial<LoggerService>
  let adapter: TelegramTwoFactorAdapter

  beforeEach(() => {
    authAdapterMock = {
      initialize: vi.fn().mockResolvedValue(undefined),
      createLoginWidget: vi.fn(),
      authenticate: vi
        .fn()
        .mockResolvedValue({ isSuccess: true, userData: { id: 123, firstName: 'Test' } }),
    }

    loggerMock = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }

    const configMock = {
      botId: 'test_bot_id',
      redirectUrl: 'https://test.com/callback',
    }

    adapter = new TelegramTwoFactorAdapter(
      authAdapterMock as TelegramAuthAdapter,
      loggerMock as LoggerService,
      configMock,
    )
  })

  describe('initialize', () => {
    it('должен успешно инициализироваться', async () => {
      await adapter.initialize()
      expect(authAdapterMock.initialize).toHaveBeenCalledOnce()
      expect(loggerMock.debug).toHaveBeenCalledWith('Telegram 2FA adapter initialized')
    })

    it('должен создавать контейнер для виджета, если он не существует', async () => {
      document.body.innerHTML = ''
      await adapter.initialize()
      const container = document.getElementById('telegram-2fa-container')
      expect(container).not.toBeNull()
      const widget = document.getElementById('telegram-2fa-widget')
      expect(widget).not.toBeNull()
      expect(container?.style.display).toBe('none')
    })
  })

  describe('sendCode', () => {
    beforeEach(async () => {
      await adapter.initialize()
    })

    it('должен подготавливать виджет для telegram метода', async () => {
      const method = {
        id: 'tg',
        type: TwoFactorMethodType.TELEGRAM,
        isAvailable: true,
        isConfigured: true,
      }
      await adapter.sendCode(method)
      expect(authAdapterMock.createLoginWidget).toHaveBeenCalledWith('telegram-2fa-widget', {
        size: 'medium',
      })
    })

    it('должен выбрасывать ошибку для неподдерживаемого типа метода', async () => {
      const method = {
        id: 'sms',
        type: TwoFactorMethodType.SMS,
        isAvailable: true,
        isConfigured: true,
      }
      await expect(adapter.sendCode(method)).rejects.toThrow('Invalid method type for Telegram 2FA')
    })
  })

  describe('verifyCode', () => {
    beforeEach(async () => {
      await adapter.initialize()
    })

    it('должен успешно верифицировать через authenticate', async () => {
      const result = await adapter.verifyCode()

      expect(authAdapterMock.authenticate).toHaveBeenCalledWith()
      expect(result.isSuccess).toBe(true)
      expect(result.userData).toBeDefined()
    })

    it('должен обрабатывать ошибки аутентификации', async () => {
      authAdapterMock.authenticate = vi
        .fn()
        .mockResolvedValue({ isSuccess: false, error: new Error('Auth failed') })

      const result = await adapter.verifyCode()

      expect(result.isSuccess).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('setupMethod', () => {
    it('должен настраивать метод и возвращать setupData', async () => {
      const result = await adapter.setupMethod()

      expect(authAdapterMock.createLoginWidget).toHaveBeenCalledWith('telegram-2fa-widget', {
        size: 'large',
      })
      expect(result.setupData).toBeDefined()
      expect(result.setupData.widgetId).toBe('telegram-2fa-widget')
    })
  })

  describe('confirmMethodSetup', () => {
    beforeEach(async () => {
      await adapter.initialize()
    })

    it('должен подтверждать настройку метода', async () => {
      const userData = await adapter.confirmMethodSetup()

      expect(authAdapterMock.authenticate).toHaveBeenCalledWith()
      expect(userData).toBeDefined()
      expect(userData.id).toBe(123)
    })

    it('должен выбрасывать ошибку при неудачной аутентификации', async () => {
      authAdapterMock.authenticate = vi.fn().mockResolvedValue({ isSuccess: false })

      await expect(adapter.confirmMethodSetup()).rejects.toThrow('Telegram authentication failed')
    })
  })

  describe('disableMethod', () => {
    it('должен отключать метод без ошибок', async () => {
      await expect(adapter.disableMethod()).resolves.toBeUndefined()
      expect(loggerMock.debug).toHaveBeenCalledWith('Telegram 2FA method disabled')
    })
  })
})

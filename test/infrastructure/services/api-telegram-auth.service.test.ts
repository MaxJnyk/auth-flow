/**
 * Тесты для ApiTelegramAuthService
 * @module test/infrastructure/services/api-telegram-auth.service.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiTelegramAuthService } from '../../../src/infrastructure/services/api-telegram-auth.service'
import { HttpClient } from '../../../src/infrastructure/http/http-client.interface'
import { TokenStorage } from '../../../src/infrastructure/storage/token-storage.interface'
import { LoggerService } from '../../../src/logging/services/logger.service'
import { TgSignInOptions, TwoFactorMethodType } from '../../../src/domain/models/auth.models'

interface ApiTelegramAuthConfig {
  apiBaseUrl: string
  endpoints: {
    init: string
    auth: string
    confirm: string
  }
}

describe('ApiTelegramAuthService', () => {
  let httpClientMock: Partial<HttpClient>
  let tokenStorageMock: Partial<TokenStorage>
  let loggerMock: Partial<LoggerService>
  let service: ApiTelegramAuthService
  let config: ApiTelegramAuthConfig

  beforeEach(() => {
    httpClientMock = {
      setBaseUrl: vi.fn(),
      post: vi.fn(),
    }
    tokenStorageMock = {
      saveTokens: vi.fn(),
    }
    loggerMock = {
      log: vi.fn(),
    }
    config = {
      apiBaseUrl: 'https://api.test.com',
      endpoints: {
        init: '/tg/init',
        auth: '/tg/auth',
        confirm: '/tg/confirm',
      },
    }
    service = new ApiTelegramAuthService(
      httpClientMock as HttpClient,
      tokenStorageMock as TokenStorage,
      config,
      loggerMock as LoggerService,
    )
    vi.clearAllMocks()
  })

  describe('initSignIn', () => {
    it('должен успешно инициализировать вход и возвращать данные', async () => {
      const options: TgSignInOptions = { botName: 'testBot', redirectUrl: 'http://localhost' }
      const mockResponse = { id: '123', code: '456', qr: 'qr-code', linkToBot: 'link' }
      vi.mocked(httpClientMock.post!).mockResolvedValue(mockResponse)

      const result = await service.initSignIn(options)

      expect(httpClientMock.post).toHaveBeenCalled()
      expect(result.id).toBe(mockResponse.id)
      expect(result.url).toContain('oauth.telegram.org')
      expect(loggerMock.log).toHaveBeenCalledTimes(2)
    })

    it('должен возвращать только URL, если API-вызов не удался', async () => {
      const options: TgSignInOptions = { botName: 'testBot' }
      vi.mocked(httpClientMock.post!).mockRejectedValue(new Error('API error'))

      const result = await service.initSignIn(options)

      expect(result.url).toBeDefined()
      expect(result.id).toBeUndefined()
      expect(loggerMock.log).toHaveBeenCalledTimes(2)
    })
  })

  describe('handleAuthResult', () => {
    it('должен успешно обрабатывать данные и сохранять токены', async () => {
      const authData = { id: '123', auth_date: Date.now() / 1000, hash: 'hash' }
      const mockResponse = { tokens: { accessToken: 'token' }, user: { id: 'user1' } }
      vi.mocked(httpClientMock.post!).mockResolvedValue(mockResponse)

      const result = await service.handleAuthResult(authData)

      expect(result.isSuccess).toBe(true)
      expect(tokenStorageMock.saveTokens).toHaveBeenCalledWith(mockResponse.tokens)
      expect(loggerMock.log).toHaveBeenCalledTimes(2)
    })

    it('должен возвращать ошибку при невалидных данных', async () => {
      const authData = { id: '123' } // Невалидные данные
      const result = await service.handleAuthResult(authData)

      expect(result.isSuccess).toBe(false)
      expect(result.error).toBeDefined()
      expect(loggerMock.log).toHaveBeenCalledTimes(2)
    })

    it('должен обрабатывать требование 2FA', async () => {
      const authData = { id: '123', auth_date: Date.now() / 1000, hash: 'hash' }
      const mockResponse = { requiresTwoFactor: true, twoFactorMethods: ['sms'] }
      vi.mocked(httpClientMock.post!).mockResolvedValue(mockResponse)

      const result = await service.handleAuthResult(authData)

      expect(result.requiresTwoFactor).toBe(true)
      expect(result.twoFactorMethods).toBeDefined()
      expect(result.twoFactorMethods?.[0].type).toBe(TwoFactorMethodType.SMS)
      expect(loggerMock.log).toHaveBeenCalledTimes(2)
    })
  })

  describe('validateTelegramData', () => {
    it('должен возвращать true для валидных данных', () => {
      const data = { id: '123', auth_date: Date.now() / 1000, hash: 'hash' }
      expect(service.validateTelegramData(data)).toBe(true)
    })

    it('должен возвращать false для данных с истекшим сроком', () => {
      const data = { id: '123', auth_date: Date.now() / 1000 - 4000, hash: 'hash' }
      expect(service.validateTelegramData(data)).toBe(false)
    })
  })

  describe('confirmAuth', () => {
    it('должен успешно подтверждать аутентификацию', async () => {
      const options = { id: '123' }
      const mockResponse = {
        isSuccess: true,
        tokens: { accessToken: 'token' },
        user: { id: 'user1' },
      }
      vi.mocked(httpClientMock.post!).mockResolvedValue(mockResponse)

      const result = await service.confirmAuth(options)

      expect(result.isSuccess).toBe(true)
      expect(tokenStorageMock.saveTokens).toHaveBeenCalledWith(mockResponse.tokens)
      expect(loggerMock.log).toHaveBeenCalledTimes(4) // start, attempt, confirm, success, end
    })

    it('должен возвращать ошибку, если ID не предоставлен', async () => {
      const result = await service.confirmAuth({})

      expect(result.isSuccess).toBe(false)
      expect(result.error).toBeDefined()
      expect(loggerMock.log).toHaveBeenCalledTimes(2)
    })

    it('должен обрабатывать отмену запроса', async () => {
      const error = new Error('Abort')
      error.name = 'AbortError'
      vi.mocked(httpClientMock.post!).mockRejectedValue(error)

      const result = await service.confirmAuth({ id: '123' })

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('отменен')
      expect(loggerMock.log).toHaveBeenCalledTimes(4) // start, attempt, abort, end
    })
  })
})

/**
 * Тесты для TelegramAuth сервиса
 * @module test/domain/services/telegram-auth.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TelegramAuth } from '../../../src/domain/services/telegram-auth'
import { TelegramAuthAdapter } from '../../../src/adapters/telegram/telegram-auth.adapter'
import { ApiClient } from '../../../src/adapters/api/api-client.interface'
import { LoggerService } from '../../../src/logging/logger.service'
import { TelegramAuthConfig } from '../../../src/config/auth-config'
import {
  TgSignInOptions,
  TelegramSignInResult,
  AuthResult,
  TelegramConfirmOptions,
} from '../../../src/domain/models/auth.models'

describe('TelegramAuth', () => {
  let telegramAuth: TelegramAuth
  let mockAdapter: TelegramAuthAdapter
  let mockApiClient: ApiClient
  let mockLogger: LoggerService
  let mockConfig: TelegramAuthConfig

  beforeEach(() => {
    mockAdapter = {
      initialize: vi.fn().mockResolvedValue(undefined),
      createLoginWidget: vi.fn(),
      authenticate: vi.fn().mockResolvedValue({
        isSuccess: true,
        userData: {
          id: 123456789,
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
          photoUrl: 'https://example.com/photo.jpg',
          authDate: Math.floor(Date.now() / 1000),
          hash: 'test-hash',
        },
      }),
    } as unknown as TelegramAuthAdapter

    mockApiClient = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as ApiClient

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      log: vi.fn(),
    } as unknown as LoggerService

    mockConfig = {
      botId: 'test-bot-id',
      redirectUrl: 'https://example.com/callback',
      requestAccess: ['write'],
    } as TelegramAuthConfig

    telegramAuth = new TelegramAuth(mockAdapter, mockApiClient, mockLogger, mockConfig)
  })

  describe('initSignIn', () => {
    it('должен инициализировать вход через Telegram с базовыми параметрами', async () => {
      const mockResponse: TelegramSignInResult = {
        url: 'https://oauth.telegram.org/auth',
        id: 'test-id',
        code: 'test-code',
        qr: 'test-qr-data',
        linkToBot: 'https://t.me/testbot',
      }

      vi.mocked(mockApiClient.post).mockResolvedValue(mockResponse)

      const options: TgSignInOptions = {
        botName: 'testbot',
        redirectUrl: 'https://example.com/auth',
      }

      const result = await telegramAuth.initSignIn(options)

      expect(result.url).toContain('https://oauth.telegram.org/auth')
      expect(result.url).toContain('bot_id=testbot')
      expect(result.url).toContain('redirect_url=https%3A%2F%2Fexample.com%2Fauth')
      expect(result.id).toBe('test-id')
      expect(result.code).toBe('test-code')
      expect(result.qr).toBe('test-qr-data')
      expect(result.linkToBot).toBe('https://t.me/testbot')

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/telegram/init', {
        botId: 'testbot',
        redirectUrl: 'https://example.com/auth',
        origin: undefined,
        isBinding: undefined,
      })
    })

    it('должен использовать конфигурацию по умолчанию', async () => {
      const mockResponse: TelegramSignInResult = {
        url: 'https://oauth.telegram.org/auth',
        id: 'test-id',
      }

      vi.mocked(mockApiClient.post).mockResolvedValue(mockResponse)

      const options: TgSignInOptions = {
        botName: 'test-bot-id',
        redirectUrl: 'https://example.com/callback',
      }

      const result = await telegramAuth.initSignIn(options)

      expect(result.url).toContain('bot_id=test-bot-id')
      expect(result.url).toContain('redirect_url=https%3A%2F%2Fexample.com%2Fcallback')
      expect(result.url).toContain('request_access=write')

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/telegram/init', {
        botId: 'test-bot-id',
        redirectUrl: 'https://example.com/callback',
        origin: undefined,
        isBinding: undefined,
      })
    })

    it('должен обрабатывать дополнительные параметры', async () => {
      const mockResponse: TelegramSignInResult = {
        url: 'https://oauth.telegram.org/auth',
        id: 'test-id',
      }

      vi.mocked(mockApiClient.post).mockResolvedValue(mockResponse)

      const options: TgSignInOptions = {
        botName: 'testbot',
        origin: 'https://example.com',
        requestAccess: ['read', 'write'],
        isBinding: true,
      }

      const result = await telegramAuth.initSignIn(options)

      expect(result.url).toContain('origin=https%3A%2F%2Fexample.com')
      expect(result.url).toContain('request_access=read%2Cwrite')
      expect(result.url).toContain('binding_mode=true')

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/telegram/init', {
        botId: 'testbot',
        redirectUrl: 'https://example.com/callback',
        origin: 'https://example.com',
        isBinding: true,
      })
    })

    it('должен обрабатывать ошибки API и возвращать только URL', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('API Error'))

      const options: TgSignInOptions = {
        botName: 'testbot',
      }

      const result = await telegramAuth.initSignIn(options)

      expect(result.url).toContain('https://oauth.telegram.org/auth')
      expect(result.id).toBeUndefined()
      expect(result.code).toBeUndefined()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error during Telegram auth initialization API request',
        expect.any(Error),
      )
    })

    it('должен пробрасывать общие ошибки при создании URL', async () => {
      // Мокаем URLSearchParams чтобы вызвать ошибку до API запроса
      const originalURLSearchParams = global.URLSearchParams
      global.URLSearchParams = vi.fn().mockImplementation(() => {
        throw new Error('General error')
      })

      const options: TgSignInOptions = {
        botName: 'testbot',
      }

      await expect(telegramAuth.initSignIn(options)).rejects.toThrow('General error')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error initializing Telegram sign in',
        expect.any(Error),
      )

      // Восстанавливаем оригинальный URLSearchParams
      global.URLSearchParams = originalURLSearchParams
    })
  })

  describe('handleAuthResult', () => {
    it('должен обрабатывать валидные данные аутентификации', async () => {
      const authData = {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        photo_url: 'https://example.com/photo.jpg',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'valid-hash',
      }

      const mockResponse: AuthResult = {
        isSuccess: true,
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      }

      vi.mocked(mockApiClient.post).mockResolvedValue(mockResponse)

      const result = await telegramAuth.handleAuthResult(authData)

      expect(result.isSuccess).toBe(true)
      expect(result.tokens).toEqual(mockResponse.tokens)

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/telegram', {
        id: 123456789,
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        photoUrl: 'https://example.com/photo.jpg',
        authDate: authData.auth_date,
        hash: 'valid-hash',
      })
    })

    it('должен обрабатывать невалидные данные', async () => {
      const invalidData = {
        id: 123456789,
        // Отсутствует first_name
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'hash',
      }

      const result = await telegramAuth.handleAuthResult(invalidData)

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Invalid Telegram auth data')
      expect(mockApiClient.post).not.toHaveBeenCalled()
    })

    it('должен обрабатывать ошибки API', async () => {
      const authData = {
        id: 123456789,
        first_name: 'Test',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'valid-hash',
      }

      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('API Error'))

      const result = await telegramAuth.handleAuthResult(authData)

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('API Error')
    })

    it('должен обрабатывать общие ошибки', async () => {
      const result = await telegramAuth.handleAuthResult({} as Record<string, unknown>)

      expect(result.isSuccess).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
    })
  })

  describe('validateTelegramData', () => {
    it('должен валидировать корректные данные', () => {
      const validData = {
        id: 123456789,
        first_name: 'Test',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'valid-hash',
      }

      const result = telegramAuth.validateTelegramData(validData)

      expect(result).toBe(true)
    })

    it('должен отклонять данные с отсутствующими полями', () => {
      const invalidData = {
        id: 123456789,
        // Отсутствует first_name
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'valid-hash',
      }

      const result = telegramAuth.validateTelegramData(invalidData)

      expect(result).toBe(false)
      expect(mockLogger.warn).toHaveBeenCalledWith('Missing required fields in Telegram auth data')
    })

    it('должен отклонять устаревшие данные', () => {
      const oldData = {
        id: 123456789,
        first_name: 'Test',
        auth_date: Math.floor((Date.now() - 86400000 * 2) / 1000), // 2 дня назад
        hash: 'valid-hash',
      }

      const result = telegramAuth.validateTelegramData(oldData)

      expect(result).toBe(false)
      expect(mockLogger.warn).toHaveBeenCalledWith('Telegram auth data is too old')
    })

    it('должен обрабатывать ошибки валидации', () => {
      const invalidData = {} as Record<string, unknown>
      const result = telegramAuth.validateTelegramData(invalidData)
      expect(result).toBe(false)

      expect(mockLogger.warn).toHaveBeenCalledWith('Missing required fields in Telegram auth data')
    })
  })

  describe('initialize', () => {
    it('должен инициализировать адаптер', async () => {
      await telegramAuth.initialize()

      expect(mockAdapter.initialize).toHaveBeenCalled()
      expect(mockLogger.debug).toHaveBeenCalledWith('Telegram auth service initialized')
    })

    it('должен обрабатывать ошибки инициализации', async () => {
      const error = new Error('Initialization failed')
      vi.mocked(mockAdapter.initialize).mockRejectedValue(error)

      await expect(telegramAuth.initialize()).rejects.toThrow('Initialization failed')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error initializing Telegram auth service',
        error,
      )
    })
  })

  describe('createLoginWidget', () => {
    it('должен создавать виджет входа', () => {
      telegramAuth.createLoginWidget('telegram-widget', { size: 'large' })

      expect(mockAdapter.createLoginWidget).toHaveBeenCalledWith('telegram-widget', {
        size: 'large',
      })
      expect(mockLogger.debug).toHaveBeenCalledWith('Creating Telegram login widget', {
        details: { elementId: 'telegram-widget', size: 'large' },
      })
    })

    it('должен обрабатывать ошибки создания виджета', () => {
      const error = new Error('Widget creation failed')
      vi.mocked(mockAdapter.createLoginWidget).mockImplementation(() => {
        throw error
      })

      expect(() => telegramAuth.createLoginWidget('telegram-widget')).toThrow(
        'Widget creation failed',
      )
      expect(mockLogger.error).toHaveBeenCalledWith('Error creating Telegram login widget', error)
    })
  })

  describe('authenticateWithWidget', () => {
    it('должен аутентифицировать через виджет', async () => {
      const mockAuthResult = {
        isSuccess: true,
        userData: {
          id: 123456789,
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
          photoUrl: 'https://example.com/photo.jpg',
          authDate: Math.floor(Date.now() / 1000),
          hash: 'test-hash',
        },
      }

      const mockApiResponse: AuthResult = {
        isSuccess: true,
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      }

      vi.mocked(mockAdapter.authenticate).mockResolvedValue(mockAuthResult)
      vi.mocked(mockApiClient.post).mockResolvedValue(mockApiResponse)

      const result = await telegramAuth.authenticateWithWidget()

      expect(result.isSuccess).toBe(true)
      expect(result.tokens).toEqual(mockApiResponse.tokens)
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/telegram', mockAuthResult.userData)
    })

    it('должен обрабатывать неуспешную аутентификацию адаптера', async () => {
      const mockAuthResult = {
        isSuccess: false,
        error: new Error('Widget auth failed'),
      }

      vi.mocked(mockAdapter.authenticate).mockResolvedValue(mockAuthResult)

      const result = await telegramAuth.authenticateWithWidget()

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Widget auth failed')
      expect(mockApiClient.post).not.toHaveBeenCalled()
    })

    it('должен обрабатывать ошибки API', async () => {
      const mockAuthResult = {
        isSuccess: true,
        userData: {
          id: 123456789,
          firstName: 'Test',
          authDate: Math.floor(Date.now() / 1000),
          hash: 'test-hash',
        },
      }

      vi.mocked(mockAdapter.authenticate).mockResolvedValue(mockAuthResult)
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('API Error'))

      const result = await telegramAuth.authenticateWithWidget()

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('API Error')
    })
  })

  describe('confirmAuth', () => {
    it('должен подтверждать аутентификацию', async () => {
      const options: TelegramConfirmOptions = {
        id: 'test-id',
        isBinding: false,
      }

      const mockResponse: AuthResult = {
        isSuccess: true,
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      }

      vi.mocked(mockApiClient.post).mockResolvedValue(mockResponse)

      const result = await telegramAuth.confirmAuth(options)

      expect(result.isSuccess).toBe(true)
      expect(result.tokens).toEqual(mockResponse.tokens)
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/auth/telegram/confirm',
        { id: 'test-id' },
        {},
      )
    })

    it('должен обрабатывать дополнительные параметры', async () => {
      const options: TelegramConfirmOptions = {
        id: 'test-id',
        isBinding: true,
        twoFactorType: 'sms',
      }

      const mockResponse: AuthResult = {
        isSuccess: true,
      }

      vi.mocked(mockApiClient.post).mockResolvedValue(mockResponse)

      await telegramAuth.confirmAuth(options)

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/auth/telegram/confirm',
        {
          id: 'test-id',
          isBinding: true,
          twoFactorType: 'sms',
        },
        {},
      )
    })

    it('должен обрабатывать отсутствующий ID', async () => {
      const options: TelegramConfirmOptions = {
        id: '',
      }

      const result = await telegramAuth.confirmAuth(options)

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Missing authentication ID for confirmation')
      expect(mockApiClient.post).not.toHaveBeenCalled()
    })

    it('должен обрабатывать прерванные запросы', async () => {
      const options: TelegramConfirmOptions = {
        id: 'test-id',
      }

      const abortError = new Error('Request aborted')
      abortError.name = 'AbortError'
      vi.mocked(mockApiClient.post).mockRejectedValue(abortError)

      const result = await telegramAuth.confirmAuth(options)

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Authentication request was aborted')
    })

    it('должен обрабатывать ошибки API', async () => {
      const options: TelegramConfirmOptions = {
        id: 'test-id',
      }

      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('API Error'))

      const result = await telegramAuth.confirmAuth(options)

      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('API Error')
    })
  })
})

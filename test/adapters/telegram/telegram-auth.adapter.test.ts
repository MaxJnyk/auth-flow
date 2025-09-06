/**
 * Тесты для TelegramAuthAdapter
 * @module test/adapters/telegram/telegram-auth.adapter.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  TelegramAuthAdapter,
  TelegramUserData,
} from '../../../src/adapters/telegram/telegram-auth.adapter'
import { TelegramAuthConfig } from '../../../src/config/auth-config'
import { LoggerService } from '../../../src/logging/logger.service'

describe('TelegramAuthAdapter', () => {
  let adapter: TelegramAuthAdapter
  const mockConfig: TelegramAuthConfig = {
    botId: 'test_bot',
    redirectUrl: 'https://example.com/auth/callback',
    requestAccess: ['write'],
  }

  const mockLogger = {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
    setLevel: vi.fn(),
    setMinLevel: vi.fn(),
  } as unknown as LoggerService

  beforeEach(() => {
    // Очищаем DOM перед каждым тестом
    document.body.innerHTML = ''
    document.head.innerHTML = ''

    // Создаем адаптер с моком логгера
    adapter = new TelegramAuthAdapter(mockConfig, mockLogger)

    // Мокаем глобальные функции
    vi.stubGlobal('window', {
      ...window,
      onTelegramAuth: undefined,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('должен создавать экземпляр с правильной конфигурацией', () => {
    expect(adapter).toBeInstanceOf(TelegramAuthAdapter)
  })

  it('должен инициализировать скрипт Telegram', async () => {
    const appendChildSpy = vi.spyOn(document.head, 'appendChild')

    const initPromise = adapter.initialize()

    // Находим скрипт и эмулируем его загрузку
    const scriptElement = document.getElementById('telegram-login-script') as HTMLScriptElement
    expect(scriptElement).not.toBeNull()
    expect(scriptElement.src).toBe('https://telegram.org/js/telegram-widget.js')

    // Эмулируем загрузку скрипта
    if (scriptElement.onload) {
      scriptElement.onload(new Event('load'))
    }

    await initPromise

    expect(appendChildSpy).toHaveBeenCalled()
    expect(mockLogger.debug).toHaveBeenCalledWith('Telegram login script loaded')
  })

  it('должен создавать виджет входа', () => {
    // Создаем элемент для виджета
    const container = document.createElement('div')
    container.id = 'telegram-login'
    document.body.appendChild(container)

    adapter.createLoginWidget('telegram-login')

    const script = container.querySelector('script')
    expect(script).not.toBeNull()
    expect(script?.dataset.telegramLogin).toBe(mockConfig.botId)
    expect(script?.dataset.size).toBe('medium')
    expect(script?.dataset.authUrl).toBe(mockConfig.redirectUrl)
    expect(script?.dataset.requestAccess).toBe('write')
    expect(script?.dataset.onauth).toBe('onTelegramAuth(user)')
  })

  it('должен обрабатывать аутентификацию и проверять данные', async () => {
    // Запускаем процесс аутентификации
    const authPromise = adapter.authenticate()

    // Эмулируем событие аутентификации
    const userData: TelegramUserData = {
      id: 123456789,
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      authDate: Math.floor(Date.now() / 1000),
      hash: 'valid_hash',
    }

    // Эмулируем событие аутентификации
    const event = new CustomEvent('telegram-auth', { detail: userData })
    document.dispatchEvent(event)

    const result = await authPromise

    expect(result.isSuccess).toBe(true)
    expect(result.userData).toEqual(userData)
  })

  it('должен отклонять устаревшие данные аутентификации', async () => {
    // Запускаем процесс аутентификации
    const authPromise = adapter.authenticate()

    // Создаем устаревшие данные (более 24 часов)
    const oldAuthDate = Math.floor(Date.now() / 1000) - 86401

    // Эмулируем событие аутентификации с устаревшими данными
    const userData: TelegramUserData = {
      id: 123456789,
      firstName: 'Test',
      authDate: oldAuthDate,
      hash: 'valid_hash',
    }

    const event = new CustomEvent('telegram-auth', { detail: userData })
    document.dispatchEvent(event)

    const result = await authPromise

    expect(result.isSuccess).toBe(false)
    expect(result.error).toBeDefined()
    expect(mockLogger.warn).toHaveBeenCalledWith('Telegram auth data is too old')
  })
})

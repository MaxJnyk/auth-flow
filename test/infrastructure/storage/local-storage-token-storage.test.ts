/**
 * Тесты для LocalStorageTokenStorage
 * @module test/infrastructure/storage/local-storage-token-storage.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalStorageTokenStorage } from '../../../src/infrastructure/storage/local-storage-token-storage'
import { AuthTokens } from '../../../src/domain/models/auth.models'

// Мок для localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

// Устанавливаем мок в глобальный объект
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('LocalStorageTokenStorage', () => {
  let tokenStorage: LocalStorageTokenStorage
  const mockTokens: AuthTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  }

  beforeEach(() => {
    // Очищаем localStorage перед каждым тестом
    localStorage.clear()

    // Создаем новый экземпляр хранилища токенов
    tokenStorage = new LocalStorageTokenStorage({
      accessTokenKey: 'test_access_token',
      refreshTokenKey: 'test_refresh_token',
      expirationKey: 'test_token_expiration',
    })
  })

  it('должен сохранять токены в localStorage', () => {
    tokenStorage.saveTokens(mockTokens)

    expect(localStorage.getItem('test_access_token')).toBe(mockTokens.accessToken)
    expect(localStorage.getItem('test_refresh_token')).toBe(mockTokens.refreshToken)
    expect(localStorage.getItem('test_token_expiration')).toBeDefined()
  })

  it('должен получать токены из localStorage', () => {
    tokenStorage.saveTokens(mockTokens)
    const savedTokens = tokenStorage.getTokens()

    expect(savedTokens).toEqual({
      accessToken: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken,
      expiresIn: expect.any(Number),
      tokenType: 'Bearer',
    })
  })

  it('должен возвращать null, если токены не найдены', () => {
    const savedTokens = tokenStorage.getTokens()
    expect(savedTokens).toBeNull()
  })

  it('должен очищать токены из localStorage', () => {
    tokenStorage.saveTokens(mockTokens)
    tokenStorage.clearTokens()

    expect(localStorage.getItem('test_access_token')).toBeNull()
    expect(localStorage.getItem('test_refresh_token')).toBeNull()
    expect(localStorage.getItem('test_token_expiration')).toBeNull()
  })

  it('должен корректно проверять истечение токена', () => {
    // Устанавливаем токен с истечением через 1 час
    const futureDate = new Date()
    futureDate.setHours(futureDate.getHours() + 1)
    localStorage.setItem('test_token_expiration', futureDate.getTime().toString())
    localStorage.setItem('test_access_token', 'valid-token')

    expect(tokenStorage.isAccessTokenExpired()).toBe(false)

    // Устанавливаем токен с истекшим сроком действия
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 1)
    localStorage.setItem('test_token_expiration', pastDate.getTime().toString())

    expect(tokenStorage.isAccessTokenExpired()).toBe(true)
  })

  it('должен считать токен истекшим, если нет данных о сроке действия', () => {
    localStorage.setItem('test_access_token', 'valid-token')
    localStorage.removeItem('test_token_expiration')

    expect(tokenStorage.isAccessTokenExpired()).toBe(true)
  })
})

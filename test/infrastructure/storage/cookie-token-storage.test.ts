/**
 * Тесты для CookieTokenStorage
 * @module test/infrastructure/storage/cookie-token-storage.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CookieTokenStorage } from '../../../src/infrastructure/storage/cookie-token-storage'

// Мокаем cookies-next
vi.mock('cookies-next', () => ({
  setCookie: vi.fn(),
  getCookie: vi.fn(),
  deleteCookie: vi.fn(),
}))

import { setCookie, getCookie, deleteCookie } from 'cookies-next'

describe('CookieTokenStorage', () => {
  let storage: CookieTokenStorage
  const mockSetCookie = setCookie as unknown as ReturnType<typeof vi.fn>
  const mockGetCookie = getCookie as unknown as ReturnType<typeof vi.fn>
  const mockDeleteCookie = deleteCookie as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    storage = new CookieTokenStorage({
      secure: true,
      path: '/',
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('должен сохранять токены в cookies', () => {
    // Мокаем внутренний метод setCookie
    const setCookieSpy = vi.spyOn(storage as any, 'setCookie')

    storage.saveTokens({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresIn: 3600,
    })

    expect(setCookieSpy).toHaveBeenCalledTimes(3) // Должен вызываться 3 раза: для access, refresh и expires_at
    expect(setCookieSpy).toHaveBeenCalledWith('auth_access_token', 'test-access-token', 3600)
    expect(setCookieSpy).toHaveBeenCalledWith(
      'auth_refresh_token',
      'test-refresh-token',
      expect.any(Number),
    )
  })

  it('должен получать токены из cookies', () => {
    // Мокаем внутренний метод getCookie
    const getCookieSpy = vi.spyOn(storage as any, 'getCookie')
    getCookieSpy.mockReturnValueOnce('test-access-token')
    getCookieSpy.mockReturnValueOnce('test-refresh-token')
    getCookieSpy.mockReturnValueOnce(Date.now() + 3600000 + '') // expiresAt

    const tokens = storage.getTokens()

    expect(getCookieSpy).toHaveBeenCalledTimes(4) // Вызывается для access_token, refresh_token, expires_at и token_type
    expect(getCookieSpy).toHaveBeenCalledWith('auth_access_token')
    expect(getCookieSpy).toHaveBeenCalledWith('auth_refresh_token')
    expect(tokens).toEqual(
      expect.objectContaining({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: expect.any(Number),
      }),
    )
  })

  it('должен возвращать null, если токены не найдены', () => {
    // Мокаем внутренний метод getCookie
    const getCookieSpy = vi.spyOn(storage as any, 'getCookie').mockReturnValue(null)

    const tokens = storage.getTokens()

    expect(tokens).toBeNull()
  })

  it('должен удалять токены из cookies', () => {
    // Мокаем внутренний метод deleteCookie
    const deleteCookieSpy = vi.spyOn(storage as any, 'deleteCookie')

    storage.clearTokens()

    expect(deleteCookieSpy).toHaveBeenCalledTimes(4)
    expect(deleteCookieSpy).toHaveBeenCalledWith('auth_access_token')
    expect(deleteCookieSpy).toHaveBeenCalledWith('auth_refresh_token')
  })

  it('должен проверять наличие токена доступа', () => {
    // Мокаем внутренний метод getCookie
    const getCookieSpy = vi
      .spyOn(storage as any, 'getCookie')
      .mockReturnValueOnce('test-access-token')

    const accessToken = storage.getAccessToken()

    expect(getCookieSpy).toHaveBeenCalledWith('auth_access_token')
    expect(accessToken).toBe('test-access-token')
  })

  it('должен возвращать null, если токен отсутствует', () => {
    // Мокаем внутренний метод getCookie
    const getCookieSpy = vi.spyOn(storage as any, 'getCookie').mockReturnValueOnce(null)

    const accessToken = storage.getAccessToken()

    expect(getCookieSpy).toHaveBeenCalledWith('auth_access_token')
    expect(accessToken).toBeNull()
  })
})

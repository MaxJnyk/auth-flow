import { AuthTokens } from '../../domain/models/auth.models'
import { TokenStorage } from './token-storage.interface'

const COOKIE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRES_AT: 'auth_expires_at',
  TOKEN_TYPE: 'auth_token_type',
}

export interface CookieOptions {
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  httpOnly?: boolean
}

export class CookieTokenStorage implements TokenStorage {
  private defaultOptions: CookieOptions

  constructor(options: CookieOptions = {}) {
    this.defaultOptions = {
      path: '/',
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
      ...options,
    }
  }

  private setCookie(
    name: string,
    value: string,
    expiresInSeconds: number,
    options?: CookieOptions,
  ): void {
    const mergedOptions = { ...this.defaultOptions, ...options }
    const expires = new Date(Date.now() + expiresInSeconds * 1000)

    let cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}`

    if (mergedOptions.path) {
      cookie += `; path=${mergedOptions.path}`
    }

    if (mergedOptions.domain) {
      cookie += `; domain=${mergedOptions.domain}`
    }

    if (mergedOptions.secure) {
      cookie += '; secure'
    }

    if (mergedOptions.sameSite) {
      cookie += `; samesite=${mergedOptions.sameSite}`
    }

    document.cookie = cookie
  }

  private getCookie(name: string): string | null {
    const cookies = document.cookie.split(';')

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()

      if (cookie.startsWith(name + '=')) {
        return decodeURIComponent(cookie.substring(name.length + 1))
      }
    }

    return null
  }

  private deleteCookie(name: string, options?: CookieOptions): void {
    const mergedOptions = { ...this.defaultOptions, ...options }
    let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`

    if (mergedOptions.path) {
      cookie += `; path=${mergedOptions.path}`
    }

    if (mergedOptions.domain) {
      cookie += `; domain=${mergedOptions.domain}`
    }

    if (mergedOptions.secure) {
      cookie += '; secure'
    }

    if (mergedOptions.sameSite) {
      cookie += `; samesite=${mergedOptions.sameSite}`
    }

    document.cookie = cookie
  }

  saveTokens(tokens: AuthTokens): void {
    const expiresIn = tokens.expiresIn || 3600
    this.setCookie(COOKIE_KEYS.ACCESS_TOKEN, tokens.accessToken, expiresIn)
    this.setCookie(COOKIE_KEYS.REFRESH_TOKEN, tokens.refreshToken, expiresIn * 24)
    const expiresAt = Date.now() + expiresIn * 1000
    this.setCookie(COOKIE_KEYS.EXPIRES_AT, expiresAt.toString(), expiresIn)

    if (tokens.tokenType) {
      this.setCookie(COOKIE_KEYS.TOKEN_TYPE, tokens.tokenType, expiresIn)
    }
  }

  getTokens(): AuthTokens | null {
    const accessToken = this.getCookie(COOKIE_KEYS.ACCESS_TOKEN)
    const refreshToken = this.getCookie(COOKIE_KEYS.REFRESH_TOKEN)
    const expiresAtStr = this.getCookie(COOKIE_KEYS.EXPIRES_AT)
    const tokenType = this.getCookie(COOKIE_KEYS.TOKEN_TYPE) || 'Bearer'

    if (!accessToken || !refreshToken || !expiresAtStr) {
      return null
    }

    const expiresAt = parseInt(expiresAtStr, 10)
    const expiresIn = Math.floor((expiresAt - Date.now()) / 1000)

    if (expiresIn <= 0) {
      return null
    }

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType,
    }
  }

  getAccessToken(): string | null {
    return this.getCookie(COOKIE_KEYS.ACCESS_TOKEN)
  }

  getRefreshToken(): string | null {
    return this.getCookie(COOKIE_KEYS.REFRESH_TOKEN)
  }

  clearTokens(): void {
    this.deleteCookie(COOKIE_KEYS.ACCESS_TOKEN)
    this.deleteCookie(COOKIE_KEYS.REFRESH_TOKEN)
    this.deleteCookie(COOKIE_KEYS.EXPIRES_AT)
    this.deleteCookie(COOKIE_KEYS.TOKEN_TYPE)
  }

  isAccessTokenExpired(): boolean {
    const expiresAtStr = this.getCookie(COOKIE_KEYS.EXPIRES_AT)

    if (!expiresAtStr) {
      return true
    }

    const expiresAt = parseInt(expiresAtStr, 10)
    return Date.now() >= expiresAt
  }
}

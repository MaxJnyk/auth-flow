import { AuthTokens } from '../../domain/models/auth.models'
import { TokenStorage } from './token-storage.interface'

export interface TokenStorageConfig {
  accessTokenKey?: string
  refreshTokenKey?: string
  expirationKey?: string
  tokenTypeKey?: string
}

const DEFAULT_STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRES_AT: 'auth_expires_at',
  TOKEN_TYPE: 'auth_token_type',
}

export class LocalStorageTokenStorage implements TokenStorage {
  private readonly keys: {
    ACCESS_TOKEN: string
    REFRESH_TOKEN: string
    EXPIRES_AT: string
    TOKEN_TYPE: string
  }

  constructor(config?: TokenStorageConfig) {
    this.keys = {
      ACCESS_TOKEN: config?.accessTokenKey || DEFAULT_STORAGE_KEYS.ACCESS_TOKEN,
      REFRESH_TOKEN: config?.refreshTokenKey || DEFAULT_STORAGE_KEYS.REFRESH_TOKEN,
      EXPIRES_AT: config?.expirationKey || DEFAULT_STORAGE_KEYS.EXPIRES_AT,
      TOKEN_TYPE: config?.tokenTypeKey || DEFAULT_STORAGE_KEYS.TOKEN_TYPE,
    }
  }

  saveTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.keys.ACCESS_TOKEN, tokens.accessToken)
    localStorage.setItem(this.keys.REFRESH_TOKEN, tokens.refreshToken)
    const expiresAt = Date.now() + tokens.expiresIn * 1000
    localStorage.setItem(this.keys.EXPIRES_AT, expiresAt.toString())
    if (tokens.tokenType) {
      localStorage.setItem(this.keys.TOKEN_TYPE, tokens.tokenType)
    }
  }

  getTokens(): AuthTokens | null {
    const accessToken = localStorage.getItem(this.keys.ACCESS_TOKEN)
    const refreshToken = localStorage.getItem(this.keys.REFRESH_TOKEN)
    const expiresAtStr = localStorage.getItem(this.keys.EXPIRES_AT)
    const tokenType = localStorage.getItem(this.keys.TOKEN_TYPE) || 'Bearer'

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
    return localStorage.getItem(this.keys.ACCESS_TOKEN)
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.keys.REFRESH_TOKEN)
  }

  clearTokens(): void {
    localStorage.removeItem(this.keys.ACCESS_TOKEN)
    localStorage.removeItem(this.keys.REFRESH_TOKEN)
    localStorage.removeItem(this.keys.EXPIRES_AT)
    localStorage.removeItem(this.keys.TOKEN_TYPE)
  }

  isAccessTokenExpired(): boolean {
    const expiresAtStr = localStorage.getItem(this.keys.EXPIRES_AT)

    if (!expiresAtStr) {
      return true
    }

    const expiresAt = parseInt(expiresAtStr, 10)
    return Date.now() >= expiresAt
  }
}

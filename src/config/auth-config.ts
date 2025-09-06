import { TwoFactorMethodType } from '../domain/models/auth.models'

export interface ApiConfig {
  baseUrl: string
  authEndpoint?: string
  userEndpoint?: string
  twoFactorEndpoint?: string
  headers?: Record<string, string>
  timeout?: number
}

export interface TokenStorageConfig {
  accessTokenKey?: string
  refreshTokenKey?: string
  expirationKey?: string
  secureCookies?: boolean
  cookieDomain?: string
  cookiePath?: string
  cookieMaxAge?: number
}

export interface TelegramAuthConfig {
  botId: string
  redirectUrl: string
  requestAccess?: string[]
}

export interface TwoFactorConfig {
  availableMethods?: TwoFactorMethodType[]
  codeLifetime?: number
  codeLength?: number
}
export interface AuthConfig {
  api: ApiConfig
  tokenStorage?: TokenStorageConfig
  telegramAuth?: TelegramAuthConfig
  twoFactor?: TwoFactorConfig
  locale?: string
  debug?: boolean
}

export const defaultApiConfig: ApiConfig = {
  baseUrl: '',
  authEndpoint: '/auth',
  userEndpoint: '/users',
  twoFactorEndpoint: '/2fa',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
}

export const defaultTokenStorageConfig: TokenStorageConfig = {
  accessTokenKey: 'access_token',
  refreshTokenKey: 'refresh_token',
  expirationKey: 'token_expiration',
  secureCookies: true,
  cookiePath: '/',
  cookieMaxAge: 86400,
}

export const defaultTwoFactorConfig: TwoFactorConfig = {
  availableMethods: [TwoFactorMethodType.EMAIL, TwoFactorMethodType.SMS, TwoFactorMethodType.TOTP],
  codeLifetime: 300,
  codeLength: 6,
}

export const defaultAuthConfig: Partial<AuthConfig> = {
  api: defaultApiConfig,
  tokenStorage: defaultTokenStorageConfig,
  twoFactor: defaultTwoFactorConfig,
  locale: 'ru',
  debug: false,
}

export function mergeConfig(userConfig: Partial<AuthConfig>): AuthConfig {
  const api = {
    ...defaultApiConfig,
    ...userConfig.api,
    headers: {
      ...defaultApiConfig.headers,
      ...(userConfig.api?.headers || {}),
    },
  }
  const tokenStorage = {
    ...defaultTokenStorageConfig,
    ...(userConfig.tokenStorage || {}),
  }
  const twoFactor = {
    ...defaultTwoFactorConfig,
    ...(userConfig.twoFactor || {}),
  }
  return {
    api,
    tokenStorage,
    twoFactor,
    telegramAuth: userConfig.telegramAuth,
    locale: userConfig.locale || defaultAuthConfig.locale,
    debug: userConfig.debug || defaultAuthConfig.debug,
  } as AuthConfig
}

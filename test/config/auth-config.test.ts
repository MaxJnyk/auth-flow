import { describe, it, expect } from 'vitest'
import {
  mergeConfig,
  defaultApiConfig,
  defaultTokenStorageConfig,
  defaultTwoFactorConfig,
  defaultAuthConfig,
} from '../../src/config/auth-config'
import { TwoFactorMethodType } from '../../src/domain/models/auth.models'

describe('auth-config', () => {
  describe('defaultApiConfig', () => {
    it('должен содержать правильные значения по умолчанию', () => {
      expect(defaultApiConfig).toEqual({
        baseUrl: '',
        authEndpoint: '/auth',
        userEndpoint: '/users',
        twoFactorEndpoint: '/2fa',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })
    })
  })

  describe('defaultTokenStorageConfig', () => {
    it('должен содержать правильные значения по умолчанию', () => {
      expect(defaultTokenStorageConfig).toEqual({
        accessTokenKey: 'access_token',
        refreshTokenKey: 'refresh_token',
        expirationKey: 'token_expiration',
        secureCookies: true,
        cookiePath: '/',
        cookieMaxAge: 86400,
      })
    })
  })

  describe('defaultTwoFactorConfig', () => {
    it('должен содержать правильные значения по умолчанию', () => {
      expect(defaultTwoFactorConfig).toEqual({
        availableMethods: [
          TwoFactorMethodType.EMAIL,
          TwoFactorMethodType.SMS,
          TwoFactorMethodType.TOTP,
        ],
        codeLifetime: 300,
        codeLength: 6,
      })
    })
  })

  describe('defaultAuthConfig', () => {
    it('должен содержать правильные значения по умолчанию', () => {
      expect(defaultAuthConfig).toEqual({
        api: defaultApiConfig,
        tokenStorage: defaultTokenStorageConfig,
        twoFactor: defaultTwoFactorConfig,
        locale: 'ru',
        debug: false,
      })
    })
  })

  describe('mergeConfig', () => {
    it('должен объединять пользовательскую конфигурацию с конфигурацией по умолчанию', () => {
      const userConfig = {
        api: {
          baseUrl: 'https://api.example.com',
          timeout: 5000,
        },
        locale: 'en',
        debug: true,
      }

      const result = mergeConfig(userConfig)

      expect(result).toEqual({
        api: {
          ...defaultApiConfig,
          baseUrl: 'https://api.example.com',
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
        tokenStorage: defaultTokenStorageConfig,
        twoFactor: defaultTwoFactorConfig,
        telegramAuth: undefined,
        locale: 'en',
        debug: true,
      })
    })

    it('должен объединять заголовки API', () => {
      const userConfig = {
        api: {
          baseUrl: 'https://api.example.com',
          headers: {
            Authorization: 'Bearer token',
            'X-Custom-Header': 'value',
          },
        },
      }

      const result = mergeConfig(userConfig)

      expect(result.api.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
        'X-Custom-Header': 'value',
      })
    })

    it('должен объединять конфигурацию хранения токенов', () => {
      const userConfig = {
        tokenStorage: {
          accessTokenKey: 'custom_access_token',
          secureCookies: false,
        },
      }

      const result = mergeConfig(userConfig)

      expect(result.tokenStorage).toEqual({
        ...defaultTokenStorageConfig,
        accessTokenKey: 'custom_access_token',
        secureCookies: false,
      })
    })

    it('должен объединять конфигурацию двухфакторной аутентификации', () => {
      const userConfig = {
        twoFactor: {
          availableMethods: [TwoFactorMethodType.TELEGRAM],
          codeLifetime: 600,
        },
      }

      const result = mergeConfig(userConfig)

      expect(result.twoFactor).toEqual({
        ...defaultTwoFactorConfig,
        availableMethods: [TwoFactorMethodType.TELEGRAM],
        codeLifetime: 600,
      })
    })

    it('должен добавлять конфигурацию Telegram аутентификации', () => {
      const userConfig = {
        telegramAuth: {
          botId: 'test_bot',
          redirectUrl: 'https://example.com/callback',
          requestAccess: ['write'],
        },
      }

      const result = mergeConfig(userConfig)

      expect(result.telegramAuth).toEqual({
        botId: 'test_bot',
        redirectUrl: 'https://example.com/callback',
        requestAccess: ['write'],
      })
    })

    it('должен использовать значения по умолчанию для пустой конфигурации', () => {
      const result = mergeConfig({})

      expect(result).toEqual({
        api: defaultApiConfig,
        tokenStorage: defaultTokenStorageConfig,
        twoFactor: defaultTwoFactorConfig,
        telegramAuth: undefined,
        locale: 'ru',
        debug: false,
      })
    })

    it('должен обрабатывать частичную конфигурацию API', () => {
      const userConfig = {
        api: {
          baseUrl: 'https://api.example.com',
        },
      }

      const result = mergeConfig(userConfig)

      expect(result.api).toEqual({
        ...defaultApiConfig,
        baseUrl: 'https://api.example.com',
      })
    })

    it('должен обрабатывать пустые заголовки API', () => {
      const userConfig = {
        api: {
          baseUrl: 'https://api.example.com',
          headers: {},
        },
      }

      const result = mergeConfig(userConfig)

      expect(result.api.headers).toEqual({
        'Content-Type': 'application/json',
      })
    })
  })
})

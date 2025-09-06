import { AuthService } from '../../domain/services/auth.service'
import {
  AuthCredentials,
  AuthResult,
  AuthTokens,
  UserRegistrationData,
  UserProfile,
  TwoFactorMethod,
} from '../../domain/models/auth.models'
import { HttpClient } from '../http/http-client.interface'
import { TokenStorage } from '../storage/token-storage.interface'
import { LoggerService } from '../../logging/services/logger.service'
import { LogLevel, LogSource, LogCategory } from '../../logging/models'

export interface ApiAuthServiceConfig {
  apiBaseUrl: string
  endpoints: {
    signIn: string
    signUp: string
    refreshToken: string
    logout: string
    passwordReset: {
      request: string
      confirm: string
    }
  }
}

export class ApiAuthService implements AuthService {
  constructor(
    private httpClient: HttpClient,
    private tokenStorage: TokenStorage,
    private config: ApiAuthServiceConfig,
    private logger?: LoggerService,
  ) {
    this.httpClient.setBaseUrl(config.apiBaseUrl)
    this.setupAuthInterceptor()
  }

  private setupAuthInterceptor(): void {
    this.httpClient.setErrorInterceptor(async error => {
      // Проверяем, что error имеет нужную структуру
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response &&
        error.response.status === 401
      ) {
        const refreshToken = this.tokenStorage.getRefreshToken()

        if (refreshToken) {
          try {
            const tokens = await this.refreshToken(refreshToken)
            if (tokens) {
              return error
            }
          } catch (refreshError) {
            this.logout()
          }
        } else {
          this.logout()
        }
      }

      return error
    })
  }

  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const response = await this.httpClient.post<{
        tokens: AuthTokens
        user: UserProfile
        requiresTwoFactor?: boolean
        twoFactorMethods?: TwoFactorMethod[]
      }>(this.config.endpoints.signIn, credentials)

      if (response.requiresTwoFactor) {
        return {
          isSuccess: false,
          requiresTwoFactor: true,
          twoFactorMethods: response.twoFactorMethods,
        }
      }

      if (response.tokens) {
        this.tokenStorage.saveTokens(response.tokens)
      }

      return {
        isSuccess: true,
        tokens: response.tokens,
        user: response.user,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка аутентификации'
      return {
        isSuccess: false,
        error: new Error(errorMessage),
      }
    }
  }

  async signUp(userData: UserRegistrationData): Promise<AuthResult> {
    try {
      const response = await this.httpClient.post<{
        tokens: AuthTokens
        user: UserProfile
      }>(this.config.endpoints.signUp, userData)

      if (response.tokens) {
        this.tokenStorage.saveTokens(response.tokens)
      }

      return {
        isSuccess: true,
        tokens: response.tokens,
        user: response.user,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка регистрации'
      return {
        isSuccess: false,
        error: new Error(errorMessage),
      }
    }
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    const response = await this.httpClient.post<{ tokens: AuthTokens }>(
      this.config.endpoints.refreshToken,
      { refreshToken: token },
    )

    if (response.tokens) {
      this.tokenStorage.saveTokens(response.tokens)
    }

    return response.tokens
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.tokenStorage.getRefreshToken()

      if (refreshToken) {
        await this.httpClient.post(this.config.endpoints.logout, { refreshToken })
      }
    } catch (error: unknown) {
      // Логируем ошибку, но продолжаем процесс выхода
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during logout'
      this.logger?.log({
        level: LogLevel.IMPORTANT,
        category: LogCategory.SYSTEM,
        action: 'auth_logout_error',
        source: LogSource.BACKEND,
        details: { error: errorMessage },
        success: false,
        timestamp: Date.now(),
        correlationId: `logout_${Date.now()}`,
      })
    } finally {
      this.tokenStorage.clearTokens()
    }
  }

  isAuthenticated(): boolean {
    return !!this.tokenStorage.getAccessToken() && !this.tokenStorage.isAccessTokenExpired()
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.httpClient.post(this.config.endpoints.passwordReset.request, { email })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.httpClient.post(this.config.endpoints.passwordReset.confirm, {
      token,
      password: newPassword,
    })
  }
}

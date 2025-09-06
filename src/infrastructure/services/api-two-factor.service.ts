import { TwoFactorService } from '../../domain/services/two-factor.service'
import {
  AuthResult,
  AuthTokens,
  TwoFactorMethod,
  UserProfile,
} from '../../domain/models/auth.models'
import { HttpClient } from '../http/http-client.interface'
import { TokenStorage } from '../storage/token-storage.interface'
import { TwoFactorSetupResponse } from '../../domain/models/two-factor-setup.model'

export interface ApiTwoFactorServiceConfig {
  apiBaseUrl: string
  endpoints: {
    verify: string
    send: string
    methods: string
    setup: string
    confirm: string
    disable: string
  }
}

export class ApiTwoFactorService implements TwoFactorService {
  private httpClient: HttpClient
  private tokenStorage: TokenStorage
  private config: ApiTwoFactorServiceConfig

  constructor(
    httpClient: HttpClient,
    tokenStorage: TokenStorage,
    config: ApiTwoFactorServiceConfig,
  ) {
    this.httpClient = httpClient
    this.tokenStorage = tokenStorage
    this.config = config
    this.httpClient.setBaseUrl(config.apiBaseUrl)
  }

  async verifyCode(code: string, method: TwoFactorMethod): Promise<AuthResult> {
    try {
      const response = await this.httpClient.post<{
        tokens: AuthTokens
        user: UserProfile
      }>(this.config.endpoints.verify, { code, method })

      if (response.tokens) {
        this.tokenStorage.saveTokens(response.tokens)
      }

      return {
        isSuccess: true,
        tokens: response.tokens,
        user: response.user,
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ошибка проверки кода двухфакторной аутентификации'
      return {
        isSuccess: false,
        error: new Error(errorMessage),
      }
    }
  }
  async sendCode(method: TwoFactorMethod): Promise<void> {
    await this.httpClient.post(this.config.endpoints.send, { method })
  }
  async getAvailableMethods(): Promise<TwoFactorMethod[]> {
    const response = await this.httpClient.get<{ methods: TwoFactorMethod[] }>(
      this.config.endpoints.methods,
    )
    return response.methods
  }
  async setupMethod(method: TwoFactorMethod): Promise<TwoFactorSetupResponse> {
    const response = await this.httpClient.post<TwoFactorSetupResponse>(
      this.config.endpoints.setup,
      {
        method,
      },
    )
    return response
  }
  async confirmMethodSetup(method: TwoFactorMethod, code: string): Promise<void> {
    await this.httpClient.post(this.config.endpoints.confirm, { method, code })
  }
  async disableMethod(method: TwoFactorMethod): Promise<void> {
    await this.httpClient.post(this.config.endpoints.disable, { method })
  }
}

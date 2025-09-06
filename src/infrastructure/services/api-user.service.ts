import { UserService } from '../../domain/services/user.service'
import {
  EmailChangeData,
  PasswordChangeData,
  ProfileUpdateData,
  UserProfile,
} from '../../domain/models/user.models'
import { HttpClient } from '../http/http-client.interface'
import { TokenStorage } from '../storage/token-storage.interface'

export interface ApiUserServiceConfig {
  apiBaseUrl: string
  endpoints: {
    profile: {
      get: string
      update: string
    }
    password: {
      change: string
    }
    email: {
      change: {
        request: string
        confirm: string
      }
      verification: {
        request: string
        confirm: string
      }
    }
  }
}

export class ApiUserService implements UserService {
  private httpClient: HttpClient
  private tokenStorage: TokenStorage
  private config: ApiUserServiceConfig
  private currentUser: UserProfile | null = null

  constructor(httpClient: HttpClient, tokenStorage: TokenStorage, config: ApiUserServiceConfig) {
    this.httpClient = httpClient
    this.tokenStorage = tokenStorage
    this.config = config
    this.httpClient.setBaseUrl(config.apiBaseUrl)
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    if (!this.tokenStorage.getAccessToken() || this.tokenStorage.isAccessTokenExpired()) {
      return null
    }

    try {
      if (this.currentUser) {
        return this.currentUser
      }
      const response = await this.httpClient.get<{ user: UserProfile }>(
        this.config.endpoints.profile.get,
      )
      this.currentUser = response.user
      return this.currentUser
    } catch (error) {
      return null
    }
  }

  async updateProfile(data: ProfileUpdateData): Promise<UserProfile> {
    const response = await this.httpClient.put<{ user: UserProfile }>(
      this.config.endpoints.profile.update,
      data,
    )
    this.currentUser = response.user
    return response.user
  }

  async changePassword(data: PasswordChangeData): Promise<void> {
    await this.httpClient.post(this.config.endpoints.password.change, data)
  }

  async requestEmailChange(data: EmailChangeData): Promise<void> {
    await this.httpClient.post(this.config.endpoints.email.change.request, data)
  }

  async confirmEmailChange(token: string): Promise<void> {
    await this.httpClient.post(this.config.endpoints.email.change.confirm, { token })
    this.currentUser = null
  }

  async requestEmailVerification(): Promise<void> {
    await this.httpClient.post(this.config.endpoints.email.verification.request, {})
  }

  async verifyEmail(token: string): Promise<void> {
    await this.httpClient.post(this.config.endpoints.email.verification.confirm, { token })
    this.currentUser = null
  }
}

import { AuthTokens } from '../../domain/models/auth.models'

export interface TokenStorage {
  saveTokens(tokens: AuthTokens): void
  getTokens(): AuthTokens | null
  getAccessToken(): string | null
  getRefreshToken(): string | null
  clearTokens(): void
  isAccessTokenExpired(): boolean
}

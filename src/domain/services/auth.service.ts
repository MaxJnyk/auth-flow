import {
  AuthCredentials,
  AuthResult,
  AuthTokens,
  UserRegistrationData,
} from '../models/auth.models'

export interface AuthService {
  signIn(credentials: AuthCredentials): Promise<AuthResult>
  signUp(userData: UserRegistrationData): Promise<AuthResult>
  refreshToken(token: string): Promise<AuthTokens>
  logout(): Promise<void>
  isAuthenticated(): boolean
  requestPasswordReset(email: string): Promise<void>
  resetPassword(token: string, newPassword: string): Promise<void>
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface UserRegistrationData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType?: string
}

export interface AuthResult {
  isSuccess: boolean
  tokens?: AuthTokens
  user?: UserProfile
  error?: Error
  requiresTwoFactor?: boolean
  twoFactorMethods?: TwoFactorMethod[]
  id?: string
}

export interface EmailSignUpData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export enum TwoFactorMethodType {
  EMAIL = 'email',
  SMS = 'sms',
  TELEGRAM = 'telegram',
  TOTP = 'totp',
}

export interface TwoFactorMethod {
  id: string
  type: TwoFactorMethodType
  isAvailable: boolean
  isConfigured: boolean
  maskedIdentifier?: string
  userId?: string
}

export interface TgSignInOptions {
  botName: string
  redirectUrl?: string
  origin?: string
  requestAccess?: string[]
  isBinding?: boolean
}

export interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  roles?: string[]
  permissions?: string[]
  isEmailVerified?: boolean
  mfaEnabled?: boolean
  mfaMethods?: TwoFactorMethod[]
}

export interface TelegramSignInResult {
  url: string
  id?: string
  code?: string
  qr?: string
  linkToBot?: string
}

export interface TelegramConfirmOptions {
  id?: string
  isBinding?: boolean
  twoFactorType?: string
  abortSignal?: AbortSignal
}

export interface TelegramAuthData {
  id?: string
  code?: string
  user_id?: string
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date?: number
  hash?: string
  [key: string]: string | number | undefined
}

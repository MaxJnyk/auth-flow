import { TwoFactorMethod } from './auth.models'

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
  lastLogin?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface ProfileUpdateData {
  firstName?: string
  lastName?: string
  displayName?: string
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface EmailChangeData {
  newEmail: string
  password: string
}

export interface UserSession {
  id: string
  device: string
  browser: string
  ip: string
  location?: string
  lastActive: Date
  isCurrentSession: boolean
}

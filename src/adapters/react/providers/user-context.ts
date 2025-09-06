import { createContext } from 'react'
import {
  EmailChangeData,
  PasswordChangeData,
  ProfileUpdateData,
  UserProfile,
} from '../../../domain/models/user.models'

export interface UserContextValue {
  user: UserProfile | null
  isLoading: boolean
  error: Error | null
  loadUser: () => Promise<UserProfile | null>
  updateProfile: (data: ProfileUpdateData) => Promise<UserProfile>
  changePassword: (data: PasswordChangeData) => Promise<void>
  requestEmailChange: (data: EmailChangeData) => Promise<void>
  confirmEmailChange: (token: string) => Promise<void>
  requestEmailVerification: () => Promise<void>
  verifyEmail: (token: string) => Promise<void>
}

const defaultUserContext: UserContextValue = {
  user: null,
  isLoading: false,
  error: null,
  loadUser: async () => null,
  updateProfile: async () => {
    throw new Error('UserContext не инициализирован')
  },
  changePassword: async () => {
    throw new Error('UserContext не инициализирован')
  },
  requestEmailChange: async () => {
    throw new Error('UserContext не инициализирован')
  },
  confirmEmailChange: async () => {
    throw new Error('UserContext не инициализирован')
  },
  requestEmailVerification: async () => {
    throw new Error('UserContext не инициализирован')
  },
  verifyEmail: async () => {
    throw new Error('UserContext не инициализирован')
  },
}

export const UserContext = createContext<UserContextValue>(defaultUserContext)

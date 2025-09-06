import { createContext } from 'react'
import {
  AuthCredentials,
  AuthResult,
  UserRegistrationData,
} from '../../../domain/models/auth.models'

export interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  error: Error | null
  signIn: (credentials: AuthCredentials) => Promise<AuthResult>
  signUp: (userData: UserRegistrationData) => Promise<AuthResult>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
}

const defaultAuthContext: AuthContextValue = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  signIn: async () => ({ isSuccess: false, error: new Error('AuthContext not initialized') }),
  signUp: async () => ({ isSuccess: false, error: new Error('AuthContext not initialized') }),
  logout: async () => {
    throw new Error('AuthContext not initialized')
  },
  requestPasswordReset: async () => {
    throw new Error('AuthContext not initialized')
  },
  resetPassword: async () => {
    throw new Error('AuthContext not initialized')
  },
}

export const AuthContext = createContext<AuthContextValue>(defaultAuthContext)

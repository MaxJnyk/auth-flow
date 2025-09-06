import { createContext } from 'react'
import {
  AuthResult,
  TelegramAuthData,
  TelegramConfirmOptions,
  TelegramSignInResult,
  TgSignInOptions,
} from '../../../domain/models/auth.models'
import { TelegramTwoFactorState } from '../hooks/use-telegram-auth'

export interface TelegramAuthContextValue {
  authUrl: string | null
  sessionId: string | null
  code: string | null
  qr: string | null
  linkToBot: string | null
  isLoading: boolean
  error: Error | null
  isPolling: boolean
  twoFactorState: TelegramTwoFactorState | null
  initSignIn: (options: TgSignInOptions) => Promise<TelegramSignInResult>
  handleAuthResult: (data: TelegramAuthData) => Promise<AuthResult>
  openTelegramAuth: (options: TgSignInOptions) => Promise<void>
  confirmAuth: (options: TelegramConfirmOptions) => Promise<AuthResult>
  abortAuth: () => void
}

const defaultTelegramAuthContext: TelegramAuthContextValue = {
  authUrl: null,
  sessionId: null,
  code: null,
  qr: null,
  linkToBot: null,
  isLoading: false,
  error: null,
  isPolling: false,
  twoFactorState: null,
  initSignIn: async () => {
    throw new Error('TelegramAuthContext не инициализирован')
  },
  handleAuthResult: async () => ({
    isSuccess: false,
    error: new Error('TelegramAuthContext не инициализирован'),
  }),
  openTelegramAuth: async () => {
    throw new Error('TelegramAuthContext не инициализирован')
  },
  confirmAuth: async () => ({
    isSuccess: false,
    error: new Error('TelegramAuthContext не инициализирован'),
  }),
  abortAuth: () => {
    throw new Error('TelegramAuthContext не инициализирован')
  },
}

export const TelegramAuthContext = createContext<TelegramAuthContextValue>(
  defaultTelegramAuthContext,
)

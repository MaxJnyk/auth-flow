import { createContext } from 'react'
import { AuthResult, TwoFactorMethod } from '../../../domain/models/auth.models'

export interface TwoFactorContextValue {
  isRequired: boolean
  availableMethods: TwoFactorMethod[]
  selectedMethod: TwoFactorMethod | null
  isLoading: boolean
  error: Error | null
  setupData: any | null
  setTwoFactorRequired: (required: boolean, methods?: TwoFactorMethod[]) => void
  selectMethod: (method: TwoFactorMethod) => void
  verifyCode: (code: string) => Promise<AuthResult>
  sendCode: () => Promise<void>
  getAvailableMethods: () => Promise<TwoFactorMethod[]>
  setupMethod: (method: TwoFactorMethod) => Promise<void>
  confirmMethodSetup: (code: string) => Promise<void>
  disableMethod: (method: TwoFactorMethod) => Promise<void>
  reset: () => void
}

const defaultTwoFactorContext: TwoFactorContextValue = {
  isRequired: false,
  availableMethods: [],
  selectedMethod: null,
  isLoading: false,
  error: null,
  setupData: null,
  setTwoFactorRequired: () => {},
  selectMethod: () => {},
  verifyCode: async () => ({
    isSuccess: false,
    error: new Error('TwoFactorContext не инициализирован'),
  }),
  sendCode: async () => {
    throw new Error('TwoFactorContext не инициализирован')
  },
  getAvailableMethods: async () => [],
  setupMethod: async () => {
    throw new Error('TwoFactorContext не инициализирован')
  },
  confirmMethodSetup: async () => {
    throw new Error('TwoFactorContext не инициализирован')
  },
  disableMethod: async () => {
    throw new Error('TwoFactorContext не инициализирован')
  },
  reset: () => {},
}

export const TwoFactorContext = createContext<TwoFactorContextValue>(defaultTwoFactorContext)

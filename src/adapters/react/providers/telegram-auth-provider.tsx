import { FC, ReactNode } from 'react'
import { TelegramAuthContext } from './telegram-auth-context'
import { TelegramAuthService } from '../../../domain/services/telegram-auth'
import { AuthStore } from '../../store/auth-store'
import { useTelegramAuth } from '../hooks/use-telegram-auth'

export interface TelegramAuthProviderProps {
  children: ReactNode
  telegramAuthService: TelegramAuthService
  authStore: AuthStore
}

export const TelegramAuthProvider: FC<TelegramAuthProviderProps> = ({
  children,
  telegramAuthService,
  authStore,
}) => {
  const telegramAuthState = useTelegramAuth(telegramAuthService, authStore)

  return (
    <TelegramAuthContext.Provider value={telegramAuthState}>
      {children}
    </TelegramAuthContext.Provider>
  )
}

import { useContext } from 'react'
import { TelegramAuthContext, TelegramAuthContextValue } from '../providers/telegram-auth-context'

export function useTelegramAuthContext(): TelegramAuthContextValue {
  const context = useContext(TelegramAuthContext)

  if (!context) {
    throw new Error('useTelegramAuthContext должен использоваться внутри TelegramAuthProvider')
  }

  return context
}

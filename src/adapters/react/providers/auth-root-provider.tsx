import { FC, ReactNode } from 'react'
import { AuthProvider, AuthProviderProps } from './auth-provider'
import { UserProvider, UserProviderProps } from './user-provider'
import { TwoFactorProvider, TwoFactorProviderProps } from './two-factor-provider'
import { TelegramAuthProvider, TelegramAuthProviderProps } from './telegram-auth-provider'

export interface AuthRootProviderProps {
  children: ReactNode
  authProviderProps: AuthProviderProps
  userProviderProps: UserProviderProps
  twoFactorProviderProps?: TwoFactorProviderProps
  telegramAuthProviderProps?: TelegramAuthProviderProps
}

export const AuthRootProvider: FC<AuthRootProviderProps> = ({
  children,
  authProviderProps,
  userProviderProps,
  twoFactorProviderProps,
  telegramAuthProviderProps,
}) => {
  let content = <>{children}</>

  if (telegramAuthProviderProps) {
    content = <TelegramAuthProvider {...telegramAuthProviderProps}>{content}</TelegramAuthProvider>
  }

  if (twoFactorProviderProps) {
    content = <TwoFactorProvider {...twoFactorProviderProps}>{content}</TwoFactorProvider>
  }

  content = <UserProvider {...userProviderProps}>{content}</UserProvider>

  return <AuthProvider {...authProviderProps}>{content}</AuthProvider>
}

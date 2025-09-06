import { FC, ReactNode, useEffect } from 'react'
import { AuthContext } from './auth-context'
import { AuthService } from '../../../domain/services/auth.service'
import { AuthStore } from '../../store/auth-store'
import { useAuth } from '../hooks/use-auth'

export interface AuthProviderProps {
  children: ReactNode
  authService: AuthService
  authStore: AuthStore
  onInit?: () => Promise<void>
}

export const AuthProvider: FC<AuthProviderProps> = ({
  children,
  authService,
  authStore,
  onInit,
}) => {
  const auth = useAuth(authService, authStore)

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (onInit) {
          await onInit()
        } else {
          const isAuthenticated = authService.isAuthenticated()
          authStore.setAuthenticated(isAuthenticated)
        }
      } catch (error) {
        console.error('Ошибка при проверке статуса аутентификации:', error)
      }
    }

    checkAuthStatus()
  }, [authService, authStore, onInit])

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

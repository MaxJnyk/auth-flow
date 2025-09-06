import { useCallback, useEffect } from 'react'
import { UserService } from '../../../domain/services/user.service'
import {
  EmailChangeData,
  PasswordChangeData,
  ProfileUpdateData,
  UserProfile,
} from '../../../domain/models/user.models'
import { UserStore } from '../../store/user-store'
import { useStore } from './use-store'

export function useUser(userService: UserService, userStore: UserStore, isAuthenticated: boolean) {
  const { user, isLoading, error } = useStore(userStore)

  useEffect(() => {
    if (isAuthenticated) {
      loadUser()
    } else {
      userStore.reset()
    }
  }, [isAuthenticated])

  const loadUser = useCallback(async (): Promise<UserProfile | null> => {
    if (!isAuthenticated) {
      return null
    }

    try {
      userStore.setLoading(true)
      const userData = await userService.getCurrentUser()
      userStore.setUser(userData)
      return userData
    } catch (error: any) {
      userStore.setError(new Error(error.message || 'Ошибка при загрузке данных пользователя'))
      return null
    } finally {
      userStore.setLoading(false)
    }
  }, [userService, userStore, isAuthenticated])

  const updateProfile = useCallback(
    async (data: ProfileUpdateData): Promise<UserProfile> => {
      try {
        userStore.setLoading(true)
        const updatedUser = await userService.updateProfile(data)
        userStore.setUser(updatedUser)
        return updatedUser
      } catch (error: any) {
        userStore.setError(new Error(error.message || 'Ошибка при обновлении профиля'))
        throw error
      } finally {
        userStore.setLoading(false)
      }
    },
    [userService, userStore],
  )

  const changePassword = useCallback(
    async (data: PasswordChangeData): Promise<void> => {
      try {
        userStore.setLoading(true)
        await userService.changePassword(data)
      } catch (error: any) {
        userStore.setError(new Error(error.message || 'Ошибка при смене пароля'))
        throw error
      } finally {
        userStore.setLoading(false)
      }
    },
    [userService, userStore],
  )

  const requestEmailChange = useCallback(
    async (data: EmailChangeData): Promise<void> => {
      try {
        userStore.setLoading(true)
        await userService.requestEmailChange(data)
      } catch (error: any) {
        userStore.setError(new Error(error.message || 'Ошибка при запросе смены email'))
        throw error
      } finally {
        userStore.setLoading(false)
      }
    },
    [userService, userStore],
  )

  const confirmEmailChange = useCallback(
    async (token: string): Promise<void> => {
      try {
        userStore.setLoading(true)
        await userService.confirmEmailChange(token)
        await loadUser()
      } catch (error: any) {
        userStore.setError(new Error(error.message || 'Ошибка при подтверждении смены email'))
        throw error
      } finally {
        userStore.setLoading(false)
      }
    },
    [userService, userStore, loadUser],
  )

  const requestEmailVerification = useCallback(async (): Promise<void> => {
    try {
      userStore.setLoading(true)
      await userService.requestEmailVerification()
    } catch (error: any) {
      userStore.setError(new Error(error.message || 'Ошибка при запросе подтверждения email'))
      throw error
    } finally {
      userStore.setLoading(false)
    }
  }, [userService, userStore])

  const verifyEmail = useCallback(
    async (token: string): Promise<void> => {
      try {
        userStore.setLoading(true)
        await userService.verifyEmail(token)

        await loadUser()
      } catch (error: any) {
        userStore.setError(new Error(error.message || 'Ошибка при подтверждении email'))
        throw error
      } finally {
        userStore.setLoading(false)
      }
    },
    [userService, userStore, loadUser],
  )

  return {
    user,
    isLoading,
    error,
    loadUser,
    updateProfile,
    changePassword,
    requestEmailChange,
    confirmEmailChange,
    requestEmailVerification,
    verifyEmail,
  }
}

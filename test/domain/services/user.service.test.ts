import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ApiUserService,
  ApiUserServiceConfig,
} from '../../../src/infrastructure/services/api-user.service'
import { HttpClient } from '../../../src/infrastructure/http/http-client.interface'
import { TokenStorage } from '../../../src/infrastructure/storage/token-storage.interface'
import {
  EmailChangeData,
  PasswordChangeData,
  ProfileUpdateData,
  UserProfile,
} from '../../../src/domain/models/user.models'

describe('ApiUserService', () => {
  let userService: ApiUserService
  let mockHttpClient: HttpClient
  let mockTokenStorage: TokenStorage
  let config: ApiUserServiceConfig

  const mockUserProfile: UserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser',
    isEmailVerified: true,
  }

  beforeEach(() => {
    // Создаем моки для зависимостей
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      setBaseUrl: vi.fn(),
      setHeader: vi.fn(),
      setHeaders: vi.fn(),
      removeHeader: vi.fn(),
      setInterceptor: vi.fn(),
    }

    mockTokenStorage = {
      getAccessToken: vi.fn(),
      getRefreshToken: vi.fn(),
      saveTokens: vi.fn(),
      clearTokens: vi.fn(),
      isAccessTokenExpired: vi.fn(),
      isRefreshTokenExpired: vi.fn(),
    }

    // Конфигурация для ApiUserService
    config = {
      apiBaseUrl: 'https://api.example.com',
      endpoints: {
        profile: {
          get: '/user/profile',
          update: '/user/profile/update',
        },
        password: {
          change: '/user/password/change',
        },
        email: {
          change: {
            request: '/user/email/change/request',
            confirm: '/user/email/change/confirm',
          },
          verification: {
            request: '/user/email/verification/request',
            confirm: '/user/email/verification/confirm',
          },
        },
      },
    }

    // Создаем экземпляр сервиса с моками
    userService = new ApiUserService(mockHttpClient, mockTokenStorage, config)
  })

  describe('getCurrentUser', () => {
    it('should return null if no access token', async () => {
      // Arrange
      vi.mocked(mockTokenStorage.getAccessToken).mockReturnValue(null)

      // Act
      const result = await userService.getCurrentUser()

      // Assert
      expect(result).toBeNull()
      expect(mockTokenStorage.getAccessToken).toHaveBeenCalled()
      expect(mockHttpClient.get).not.toHaveBeenCalled()
    })

    it('should return null if access token is expired', async () => {
      // Arrange
      vi.mocked(mockTokenStorage.getAccessToken).mockReturnValue('expired-token')
      vi.mocked(mockTokenStorage.isAccessTokenExpired).mockReturnValue(true)

      // Act
      const result = await userService.getCurrentUser()

      // Assert
      expect(result).toBeNull()
      expect(mockTokenStorage.getAccessToken).toHaveBeenCalled()
      expect(mockTokenStorage.isAccessTokenExpired).toHaveBeenCalled()
      expect(mockHttpClient.get).not.toHaveBeenCalled()
    })

    it('should fetch user profile if token is valid', async () => {
      // Arrange
      vi.mocked(mockTokenStorage.getAccessToken).mockReturnValue('valid-token')
      vi.mocked(mockTokenStorage.isAccessTokenExpired).mockReturnValue(false)
      vi.mocked(mockHttpClient.get).mockResolvedValue({ user: mockUserProfile })

      // Act
      const result = await userService.getCurrentUser()

      // Assert
      expect(result).toEqual(mockUserProfile)
      expect(mockTokenStorage.getAccessToken).toHaveBeenCalled()
      expect(mockTokenStorage.isAccessTokenExpired).toHaveBeenCalled()
      expect(mockHttpClient.get).toHaveBeenCalledWith(config.endpoints.profile.get)
    })

    it('should return cached user profile on subsequent calls', async () => {
      // Arrange
      vi.mocked(mockTokenStorage.getAccessToken).mockReturnValue('valid-token')
      vi.mocked(mockTokenStorage.isAccessTokenExpired).mockReturnValue(false)
      vi.mocked(mockHttpClient.get).mockResolvedValue({ user: mockUserProfile })

      // Act - первый вызов
      await userService.getCurrentUser()

      // Сбрасываем моки для проверки повторного вызова
      vi.mocked(mockHttpClient.get).mockClear()

      // Act - второй вызов
      const result = await userService.getCurrentUser()

      // Assert
      expect(result).toEqual(mockUserProfile)
      expect(mockHttpClient.get).not.toHaveBeenCalled() // Не должен вызываться повторно
    })

    it('should return null if API call fails', async () => {
      // Arrange
      vi.mocked(mockTokenStorage.getAccessToken).mockReturnValue('valid-token')
      vi.mocked(mockTokenStorage.isAccessTokenExpired).mockReturnValue(false)
      vi.mocked(mockHttpClient.get).mockRejectedValue(new Error('API error'))

      // Act
      const result = await userService.getCurrentUser()

      // Assert
      expect(result).toBeNull()
      expect(mockHttpClient.get).toHaveBeenCalledWith(config.endpoints.profile.get)
    })
  })

  describe('updateProfile', () => {
    it('should update user profile and return updated profile', async () => {
      // Arrange
      const updateData: ProfileUpdateData = {
        firstName: 'Updated',
        lastName: 'Name',
      }

      const updatedProfile = {
        ...mockUserProfile,
        firstName: 'Updated',
        lastName: 'Name',
      }

      vi.mocked(mockHttpClient.put).mockResolvedValue({ user: updatedProfile })

      // Act
      const result = await userService.updateProfile(updateData)

      // Assert
      expect(result).toEqual(updatedProfile)
      expect(mockHttpClient.put).toHaveBeenCalledWith(config.endpoints.profile.update, updateData)
    })

    it('should update cached user profile after successful update', async () => {
      // Arrange
      const updateData: ProfileUpdateData = {
        firstName: 'Updated',
        lastName: 'Name',
      }

      const updatedProfile = {
        ...mockUserProfile,
        firstName: 'Updated',
        lastName: 'Name',
      }

      vi.mocked(mockHttpClient.put).mockResolvedValue({ user: updatedProfile })

      // Act
      await userService.updateProfile(updateData)

      // Сбрасываем моки для проверки кеширования
      vi.mocked(mockTokenStorage.getAccessToken).mockReturnValue('valid-token')
      vi.mocked(mockTokenStorage.isAccessTokenExpired).mockReturnValue(false)
      vi.mocked(mockHttpClient.get).mockClear()

      // Получаем текущего пользователя
      const cachedUser = await userService.getCurrentUser()

      // Assert
      expect(cachedUser).toEqual(updatedProfile)
      expect(mockHttpClient.get).not.toHaveBeenCalled() // Не должен вызываться API
    })

    it('should throw error if update fails', async () => {
      // Arrange
      const updateData: ProfileUpdateData = {
        firstName: 'Updated',
        lastName: 'Name',
      }

      vi.mocked(mockHttpClient.put).mockRejectedValue(new Error('Update failed'))

      // Act & Assert
      await expect(userService.updateProfile(updateData)).rejects.toThrow('Update failed')
      expect(mockHttpClient.put).toHaveBeenCalledWith(config.endpoints.profile.update, updateData)
    })
  })

  describe('changePassword', () => {
    it('should call API to change password', async () => {
      // Arrange
      const passwordData: PasswordChangeData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue({})

      // Act
      await userService.changePassword(passwordData)

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        config.endpoints.password.change,
        passwordData,
      )
    })

    it('should throw error if password change fails', async () => {
      // Arrange
      const passwordData: PasswordChangeData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      }

      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error('Invalid current password'))

      // Act & Assert
      await expect(userService.changePassword(passwordData)).rejects.toThrow(
        'Invalid current password',
      )
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        config.endpoints.password.change,
        passwordData,
      )
    })
  })

  describe('requestEmailChange', () => {
    it('should call API to request email change', async () => {
      // Arrange
      const emailData: EmailChangeData = {
        newEmail: 'new@example.com',
        password: 'password123',
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue({})

      // Act
      await userService.requestEmailChange(emailData)

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        config.endpoints.email.change.request,
        emailData,
      )
    })

    it('should throw error if email change request fails', async () => {
      // Arrange
      const emailData: EmailChangeData = {
        newEmail: 'new@example.com',
        password: 'password123',
      }

      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error('Email already in use'))

      // Act & Assert
      await expect(userService.requestEmailChange(emailData)).rejects.toThrow(
        'Email already in use',
      )
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        config.endpoints.email.change.request,
        emailData,
      )
    })
  })

  describe('confirmEmailChange', () => {
    it('should call API to confirm email change and clear cached user', async () => {
      // Arrange
      const token = 'email-change-token'
      vi.mocked(mockHttpClient.post).mockResolvedValue({})

      // Сначала кешируем пользователя
      vi.mocked(mockTokenStorage.getAccessToken).mockReturnValue('valid-token')
      vi.mocked(mockTokenStorage.isAccessTokenExpired).mockReturnValue(false)
      vi.mocked(mockHttpClient.get).mockResolvedValue({ user: mockUserProfile })
      await userService.getCurrentUser()

      // Сбрасываем моки для проверки
      vi.mocked(mockHttpClient.get).mockClear()

      // Act
      await userService.confirmEmailChange(token)

      // Пытаемся получить пользователя снова
      await userService.getCurrentUser()

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.email.change.confirm, {
        token,
      })
      expect(mockHttpClient.get).toHaveBeenCalled() // Должен вызваться API снова
    })

    it('should throw error if email change confirmation fails', async () => {
      // Arrange
      const token = 'invalid-token'
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error('Invalid token'))

      // Act & Assert
      await expect(userService.confirmEmailChange(token)).rejects.toThrow('Invalid token')
      expect(mockHttpClient.post).toHaveBeenCalledWith(config.endpoints.email.change.confirm, {
        token,
      })
    })
  })

  describe('requestEmailVerification', () => {
    it('should call API to request email verification', async () => {
      // Arrange
      vi.mocked(mockHttpClient.post).mockResolvedValue({})

      // Act
      await userService.requestEmailVerification()

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        config.endpoints.email.verification.request,
        {},
      )
    })

    it('should throw error if email verification request fails', async () => {
      // Arrange
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error('Too many requests'))

      // Act & Assert
      await expect(userService.requestEmailVerification()).rejects.toThrow('Too many requests')
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        config.endpoints.email.verification.request,
        {},
      )
    })
  })

  describe('verifyEmail', () => {
    it('should call API to verify email and clear cached user', async () => {
      // Arrange
      const token = 'email-verification-token'
      vi.mocked(mockHttpClient.post).mockResolvedValue({})

      // Сначала кешируем пользователя
      vi.mocked(mockTokenStorage.getAccessToken).mockReturnValue('valid-token')
      vi.mocked(mockTokenStorage.isAccessTokenExpired).mockReturnValue(false)
      vi.mocked(mockHttpClient.get).mockResolvedValue({ user: mockUserProfile })
      await userService.getCurrentUser()

      // Сбрасываем моки для проверки
      vi.mocked(mockHttpClient.get).mockClear()

      // Act
      await userService.verifyEmail(token)

      // Пытаемся получить пользователя снова
      await userService.getCurrentUser()

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        config.endpoints.email.verification.confirm,
        { token },
      )
      expect(mockHttpClient.get).toHaveBeenCalled() // Должен вызваться API снова
    })

    it('should throw error if email verification fails', async () => {
      // Arrange
      const token = 'invalid-token'
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error('Invalid token'))

      // Act & Assert
      await expect(userService.verifyEmail(token)).rejects.toThrow('Invalid token')
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        config.endpoints.email.verification.confirm,
        { token },
      )
    })
  })
})

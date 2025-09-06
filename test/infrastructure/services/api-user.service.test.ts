import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiUserService } from '../../../src/infrastructure/services/api-user.service'
import { HttpClient } from '../../../src/infrastructure/http/http-client.interface'
import { TokenStorage } from '../../../src/infrastructure/storage/token-storage.interface'
import {
  ProfileUpdateData,
  PasswordChangeData,
  EmailChangeData,
  UserProfile,
} from '../../../src/domain/models/user.models'

describe('ApiUserService', () => {
  let httpClientMock: Partial<HttpClient>
  let tokenStorageMock: Partial<TokenStorage>
  let userService: ApiUserService
  let config: {
    apiBaseUrl: string
    endpoints: {
      profile: {
        get: string
        update: string
      }
      password: {
        change: string
      }
      email: {
        change: {
          request: string
          confirm: string
        }
        verification: {
          request: string
          confirm: string
        }
      }
    }
  }

  beforeEach(() => {
    httpClientMock = {
      setBaseUrl: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    }

    tokenStorageMock = {
      getAccessToken: vi.fn(),
      isAccessTokenExpired: vi.fn(),
    }

    config = {
      apiBaseUrl: 'https://api.test.com',
      endpoints: {
        profile: {
          get: '/user/profile',
          update: '/user/profile',
        },
        password: {
          change: '/user/password',
        },
        email: {
          change: {
            request: '/user/email/change',
            confirm: '/user/email/change/confirm',
          },
          verification: {
            request: '/user/email/verify',
            confirm: '/user/email/verify/confirm',
          },
        },
      },
    }

    userService = new ApiUserService(
      httpClientMock as HttpClient,
      tokenStorageMock as TokenStorage,
      config,
    )
  })

  describe('constructor', () => {
    it('должен настраивать базовый URL', () => {
      expect(httpClientMock.setBaseUrl).toHaveBeenCalledWith(config.apiBaseUrl)
    })
  })

  describe('getCurrentUser', () => {
    it('должен возвращать null при отсутствии токена', async () => {
      tokenStorageMock.getAccessToken = vi.fn().mockReturnValue(null)

      const result = await userService.getCurrentUser()

      expect(result).toBeNull()
    })

    it('должен возвращать null при истекшем токене', async () => {
      tokenStorageMock.getAccessToken = vi.fn().mockReturnValue('token')
      tokenStorageMock.isAccessTokenExpired = vi.fn().mockReturnValue(true)

      const result = await userService.getCurrentUser()

      expect(result).toBeNull()
    })

    it('должен возвращать кешированного пользователя', async () => {
      tokenStorageMock.getAccessToken = vi.fn().mockReturnValue('token')
      tokenStorageMock.isAccessTokenExpired = vi.fn().mockReturnValue(false)

      const mockUser: UserProfile = {
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
      }

      httpClientMock.get = vi.fn().mockResolvedValue({ user: mockUser })

      const result1 = await userService.getCurrentUser()
      expect(result1).toEqual(mockUser)
      expect(httpClientMock.get).toHaveBeenCalledTimes(1)

      const result2 = await userService.getCurrentUser()
      expect(result2).toEqual(mockUser)
      expect(httpClientMock.get).toHaveBeenCalledTimes(1)
    })

    it('должен возвращать null при ошибке API', async () => {
      tokenStorageMock.getAccessToken = vi.fn().mockReturnValue('token')
      tokenStorageMock.isAccessTokenExpired = vi.fn().mockReturnValue(false)
      httpClientMock.get = vi.fn().mockRejectedValue(new Error('API Error'))

      const result = await userService.getCurrentUser()

      expect(result).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('должен обновлять профиль пользователя', async () => {
      const updateData: ProfileUpdateData = {
        firstName: 'Updated',
        lastName: 'Name',
      }

      const updatedUser: UserProfile = {
        id: '1',
        email: 'test@test.com',
        firstName: 'Updated',
        lastName: 'Name',
      }

      httpClientMock.put = vi.fn().mockResolvedValue({ user: updatedUser })

      const result = await userService.updateProfile(updateData)

      expect(httpClientMock.put).toHaveBeenCalledWith('/user/profile', updateData)
      expect(result).toEqual(updatedUser)
    })

    it('должен обновлять кешированного пользователя', async () => {
      const updateData: ProfileUpdateData = { firstName: 'Updated' }
      const updatedUser: UserProfile = {
        id: '1',
        email: 'test@test.com',
        firstName: 'Updated',
      }

      httpClientMock.put = vi.fn().mockResolvedValue({ user: updatedUser })

      await userService.updateProfile(updateData)

      tokenStorageMock.getAccessToken = vi.fn().mockReturnValue('token')
      tokenStorageMock.isAccessTokenExpired = vi.fn().mockReturnValue(false)

      const cachedUser = await userService.getCurrentUser()
      expect(cachedUser).toEqual(updatedUser)
      expect(httpClientMock.get).not.toHaveBeenCalled()
    })
  })

  describe('changePassword', () => {
    it('должен изменять пароль', async () => {
      const passwordData: PasswordChangeData = {
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new',
      }

      httpClientMock.post = vi.fn().mockResolvedValue({})

      await userService.changePassword(passwordData)

      expect(httpClientMock.post).toHaveBeenCalledWith('/user/password', passwordData)
    })
  })

  describe('requestEmailChange', () => {
    it('должен запрашивать смену email', async () => {
      const emailData: EmailChangeData = {
        newEmail: 'new@test.com',
        password: 'password',
      }

      httpClientMock.post = vi.fn().mockResolvedValue({})

      await userService.requestEmailChange(emailData)

      expect(httpClientMock.post).toHaveBeenCalledWith('/user/email/change', emailData)
    })
  })

  describe('confirmEmailChange', () => {
    it('должен подтверждать смену email и очищать кеш', async () => {
      httpClientMock.post = vi.fn().mockResolvedValue({})

      await userService.confirmEmailChange('confirm-token')

      expect(httpClientMock.post).toHaveBeenCalledWith('/user/email/change/confirm', {
        token: 'confirm-token',
      })

      tokenStorageMock.getAccessToken = vi.fn().mockReturnValue('token')
      tokenStorageMock.isAccessTokenExpired = vi.fn().mockReturnValue(false)
      httpClientMock.get = vi.fn().mockResolvedValue({
        user: { id: '1', email: 'new@test.com' },
      })

      await userService.getCurrentUser()
      expect(httpClientMock.get).toHaveBeenCalled()
    })
  })

  describe('requestEmailVerification', () => {
    it('должен запрашивать верификацию email', async () => {
      httpClientMock.post = vi.fn().mockResolvedValue({})

      await userService.requestEmailVerification()

      expect(httpClientMock.post).toHaveBeenCalledWith('/user/email/verify', {})
    })
  })

  describe('verifyEmail', () => {
    it('должен верифицировать email и очищать кеш', async () => {
      httpClientMock.post = vi.fn().mockResolvedValue({})

      await userService.verifyEmail('verify-token')

      expect(httpClientMock.post).toHaveBeenCalledWith('/user/email/verify/confirm', {
        token: 'verify-token',
      })

      tokenStorageMock.getAccessToken = vi.fn().mockReturnValue('token')
      tokenStorageMock.isAccessTokenExpired = vi.fn().mockReturnValue(false)
      httpClientMock.get = vi.fn().mockResolvedValue({
        user: { id: '1', email: 'verified@test.com', isEmailVerified: true },
      })

      await userService.getCurrentUser()
      expect(httpClientMock.get).toHaveBeenCalled()
    })
  })
})

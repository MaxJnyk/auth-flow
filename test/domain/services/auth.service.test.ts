import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '../../../src/domain/services/auth.service'
import {
  AuthCredentials,
  AuthResult,
  AuthTokens,
  UserRegistrationData,
} from '../../../src/domain/models/auth.models'
import { TokenStorage } from '../../../src/infrastructure/storage/token-storage.interface'
import { HttpClient } from '../../../src/infrastructure/http/http-client.interface'
import {
  ApiAuthService,
  ApiAuthServiceConfig,
} from '../../../src/infrastructure/services/api-auth.service'

// Создаем моки для зависимостей
const mockHttpClient = {
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  setBaseUrl: vi.fn(),
  setHeader: vi.fn(),
  deleteHeader: vi.fn(),
  setResponseInterceptor: vi.fn(),
  setErrorInterceptor: vi.fn(),
} as HttpClient

const mockTokenStorage: TokenStorage = {
  saveTokens: vi.fn(),
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  clearTokens: vi.fn(),
  isAccessTokenExpired: vi.fn(),
  getTokens: vi.fn(),
}

const mockConfig: ApiAuthServiceConfig = {
  apiBaseUrl: 'https://api.example.com',
  endpoints: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    refreshToken: '/auth/refresh',
    logout: '/auth/logout',
    passwordReset: {
      request: '/auth/request-password-reset',
      confirm: '/auth/reset-password',
    },
  },
}

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    vi.resetAllMocks()
    authService = new ApiAuthService(mockHttpClient, mockTokenStorage, mockConfig)
  })

  describe('signIn', () => {
    it('should successfully sign in with valid credentials', async () => {
      // Arrange
      const credentials: AuthCredentials = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      const mockResponse = {
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
        },
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse)

      // Act
      const result = await authService.signIn(credentials)

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(mockConfig.endpoints.signIn, credentials)
      expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith({
        accessToken: mockResponse.tokens.accessToken,
        refreshToken: mockResponse.tokens.refreshToken,
        expiresIn: mockResponse.tokens.expiresIn,
      })
      expect(result).toEqual({
        isSuccess: true,
        user: mockResponse.user,
        tokens: mockResponse.tokens,
      })
    })

    it('should handle failed sign in with invalid credentials', async () => {
      // Arrange
      const credentials: AuthCredentials = {
        email: 'test@example.com',
        password: 'WrongPassword',
      }

      const errorMessage = 'Invalid credentials'
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await authService.signIn(credentials)

      // Assert
      expect(result).toEqual({
        isSuccess: false,
        error: new Error(errorMessage),
      })
      expect(mockTokenStorage.saveTokens).not.toHaveBeenCalled()
    })

    it('should handle two-factor authentication requirement', async () => {
      // Arrange
      const credentials: AuthCredentials = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      const mockResponse = {
        requiresTwoFactor: true,
        twoFactorMethods: ['sms', 'email'],
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse)

      // Act
      const result = await authService.signIn(credentials)

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(mockConfig.endpoints.signIn, credentials)
      expect(mockTokenStorage.saveTokens).not.toHaveBeenCalled()
      expect(result).toEqual({
        isSuccess: false,
        requiresTwoFactor: true,
        twoFactorMethods: ['sms', 'email'],
      })
    })
  })

  describe('signUp', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const userData: UserRegistrationData = {
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
      }

      const mockResponse = {
        user: {
          id: '456',
          email: 'newuser@example.com',
          name: 'New User',
        },
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse)

      // Act
      const result = await authService.signUp(userData)

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(mockConfig.endpoints.signUp, userData)
      expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith({
        accessToken: mockResponse.tokens.accessToken,
        refreshToken: mockResponse.tokens.refreshToken,
        expiresIn: mockResponse.tokens.expiresIn,
      })
      expect(result).toEqual({
        isSuccess: true,
        user: mockResponse.user,
        tokens: mockResponse.tokens,
      })
    })

    it('should handle registration failure', async () => {
      // Arrange
      const userData: UserRegistrationData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'Existing',
        lastName: 'User',
      }

      const errorMessage = 'Email already exists'
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await authService.signUp(userData)

      // Assert
      expect(result).toEqual({
        isSuccess: false,
        error: new Error(errorMessage),
      })
      expect(mockTokenStorage.saveTokens).not.toHaveBeenCalled()
    })
  })

  describe('refreshToken', () => {
    it('should successfully refresh the token', async () => {
      // Arrange
      const refreshToken = 'old-refresh-token'

      const mockResponse = {
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse)

      // Act
      const result = await authService.refreshToken(refreshToken)

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(mockConfig.endpoints.refreshToken, {
        refreshToken,
      })
      expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(mockResponse.tokens)
      expect(result).toEqual(mockResponse.tokens)
    })

    it('should handle token refresh failure', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token'

      // Мокаем ошибку при обновлении токена
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error('Invalid refresh token'))

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow()
      expect(mockTokenStorage.saveTokens).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('should successfully log out the user', async () => {
      // Arrange
      const mockRefreshToken = 'refresh-token'
      vi.mocked(mockTokenStorage.getRefreshToken).mockReturnValue(mockRefreshToken)
      vi.mocked(mockHttpClient.post).mockResolvedValue({ isSuccess: true })

      // Act
      await authService.logout()

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(mockConfig.endpoints.logout, {
        refreshToken: mockRefreshToken,
      })
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled()
    })

    it('should clear tokens even if API call fails', async () => {
      // Arrange
      const mockRefreshToken = 'refresh-token'
      vi.mocked(mockTokenStorage.getRefreshToken).mockReturnValue(mockRefreshToken)
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error('Network error'))

      // Act
      await authService.logout()

      // Assert
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when user has valid token', () => {
      // Arrange
      vi.mocked(mockTokenStorage.getAccessToken).mockReturnValue('valid-token')
      vi.mocked(mockTokenStorage.isAccessTokenExpired).mockReturnValue(false)

      // Act
      const result = authService.isAuthenticated()

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when user has no token', () => {
      // Arrange
      vi.mocked(mockTokenStorage.getAccessToken).mockReturnValue(null)

      // Act
      const result = authService.isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when token is expired', () => {
      // Arrange
      vi.mocked(mockTokenStorage.getAccessToken).mockReturnValue('expired-token')
      vi.mocked(mockTokenStorage.isAccessTokenExpired).mockReturnValue(true)

      // Act
      const result = authService.isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('requestPasswordReset', () => {
    it('should successfully request password reset', async () => {
      // Arrange
      const email = 'test@example.com'
      vi.mocked(mockHttpClient.post).mockResolvedValue(undefined)

      // Act
      await authService.requestPasswordReset(email)

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(mockConfig.endpoints.passwordReset.request, {
        email,
      })
    })

    it('should handle password reset request failure', async () => {
      // Arrange
      const email = 'nonexistent@example.com'
      const mockError = new Error('User not found')
      vi.mocked(mockHttpClient.post).mockRejectedValue(mockError)

      // Act & Assert
      await expect(authService.requestPasswordReset(email)).rejects.toThrow('User not found')
    })
  })

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      // Arrange
      const token = 'reset-token'
      const newPassword = 'NewPassword123!'
      vi.mocked(mockHttpClient.post).mockResolvedValue(undefined)

      // Act
      await authService.resetPassword(token, newPassword)

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(mockConfig.endpoints.passwordReset.confirm, {
        token,
        password: newPassword,
      })
    })

    it('should handle password reset failure', async () => {
      // Arrange
      const token = 'invalid-token'
      const newPassword = 'NewPassword123!'
      const mockError = new Error('Invalid or expired token')
      vi.mocked(mockHttpClient.post).mockRejectedValue(mockError)

      // Act & Assert
      await expect(authService.resetPassword(token, newPassword)).rejects.toThrow(
        'Invalid or expired token',
      )
    })
  })
})

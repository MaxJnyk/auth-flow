/**
 * Тесты для хука useAuth
 * @module test/adapters/react/hooks/use-auth.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { useAuth } from '../../../../src/adapters/react/hooks/use-auth'
import { AuthStore } from '../../../../src/adapters/store/auth-store'
import { AuthService } from '../../../../src/domain/services/auth.service'
import { UserRegistrationData } from '../../../../src/domain/models/auth.models'

// Мокаем хук useStore вместо прямого мока хранилища
vi.mock('../../../../src/adapters/react/hooks/use-store', () => ({
  useStore: vi.fn(),
}))

// Получаем доступ к моку useStore для изменения его поведения в тестах
const mockUseStore = vi.fn()

// Устанавливаем мок по умолчанию
mockUseStore.mockImplementation(store => ({
  isAuthenticated: store?.isAuthenticated || false,
  isLoading: store?.isLoading || false,
  error: store?.error || null,
}))

// Присваиваем мок функции useStore
import { useStore } from '../../../../src/adapters/react/hooks/use-store'
vi.mocked(useStore).mockImplementation(mockUseStore)

describe('useAuth', () => {
  let mockAuthStore: AuthStore
  let mockAuthService: AuthService

  beforeEach(() => {
    // Создаем моки для хранилища и сервиса
    mockAuthStore = {
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setAuthenticated: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as unknown as AuthStore

    mockAuthService = {
      signIn: vi.fn().mockResolvedValue({
        isSuccess: true,
        tokens: { accessToken: 'test-token', refreshToken: 'refresh-token', expiresIn: 3600 },
      }),
      signUp: vi.fn().mockResolvedValue({
        isSuccess: true,
        tokens: { accessToken: 'test-token', refreshToken: 'refresh-token', expiresIn: 3600 },
      }),
      logout: vi.fn().mockResolvedValue(undefined),
      requestPasswordReset: vi.fn().mockResolvedValue(undefined),
      resetPassword: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthService
  })

  it('должен возвращать состояние аутентификации из хранилища', () => {
    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('должен вызывать signIn из сервиса и обновлять состояние', async () => {
    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    await act(async () => {
      await result.current.signIn({ email: 'test@example.com', password: 'password' })
    })

    expect(mockAuthService.signIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
    expect(mockAuthStore.setAuthenticated).toHaveBeenCalledWith(true, expect.anything())
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })

  it('должен обрабатывать ошибки при входе', async () => {
    const loginError = new Error('Invalid credentials')
    mockAuthService.signIn = vi.fn().mockResolvedValue({
      isSuccess: false,
      error: loginError,
    })

    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    await act(async () => {
      await result.current.signIn({ email: 'test@example.com', password: 'wrong-password' })
    })

    expect(mockAuthService.signIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrong-password',
    })
    expect(mockAuthStore.setError).toHaveBeenCalledWith(loginError)
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })

  it('должен вызывать logout из сервиса и обновлять состояние', async () => {
    // Мокаем useStore для этого теста, чтобы вернуть аутентифицированное состояние
    mockUseStore.mockReturnValueOnce({
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    await act(async () => {
      await result.current.logout()
    })

    expect(mockAuthService.logout).toHaveBeenCalled()
    expect(mockAuthStore.setAuthenticated).toHaveBeenCalledWith(false, null)
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })

  it('должен вызывать signUp из сервиса и обновлять состояние', async () => {
    const userData: UserRegistrationData = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    }

    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    await act(async () => {
      await result.current.signUp(userData)
    })

    expect(mockAuthService.signUp).toHaveBeenCalledWith(userData)
    expect(mockAuthStore.setAuthenticated).toHaveBeenCalledWith(true, expect.anything())
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })

  it('должен вызывать requestPasswordReset из сервиса', async () => {
    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    await act(async () => {
      await result.current.requestPasswordReset('test@example.com')
    })

    expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith('test@example.com')
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })

  it('должен обрабатывать ошибки при запросе сброса пароля', async () => {
    const resetError = new Error('Email not found')
    mockAuthService.requestPasswordReset = vi.fn().mockRejectedValue(resetError)

    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    await act(async () => {
      try {
        await result.current.requestPasswordReset('nonexistent@example.com')
      } catch (error) {
        expect(error).toBe(resetError)
      }
    })

    expect(mockAuthStore.setError).toHaveBeenCalledWith(expect.any(Error))
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })

  it('должен вызывать resetPassword из сервиса', async () => {
    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    await act(async () => {
      await result.current.resetPassword('reset-token', 'newpassword123')
    })

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith('reset-token', 'newpassword123')
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })

  it('должен обрабатывать ошибки при сбросе пароля', async () => {
    const resetError = new Error('Invalid token')
    mockAuthService.resetPassword = vi.fn().mockRejectedValue(resetError)

    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    await act(async () => {
      try {
        await result.current.resetPassword('invalid-token', 'newpassword123')
      } catch (error) {
        expect(error).toBe(resetError)
      }
    })

    expect(mockAuthStore.setError).toHaveBeenCalledWith(expect.any(Error))
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })

  it('должен обрабатывать ошибки при регистрации', async () => {
    const signUpError = new Error('Email already exists')
    mockAuthService.signUp = vi.fn().mockResolvedValue({
      isSuccess: false,
      error: signUpError,
    })

    const userData: UserRegistrationData = {
      email: 'existing@example.com',
      password: 'password123',
    }

    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    await act(async () => {
      await result.current.signUp(userData)
    })

    expect(mockAuthStore.setError).toHaveBeenCalledWith(signUpError)
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })

  it('должен обрабатывать исключения при входе', async () => {
    const thrownError = new Error('Network error')
    mockAuthService.signIn = vi.fn().mockRejectedValue(thrownError)

    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    let authResult
    await act(async () => {
      authResult = await result.current.signIn({ email: 'test@example.com', password: 'password' })
    })

    expect(authResult.isSuccess).toBe(false)
    expect(authResult.error?.message).toBe('Network error')
    expect(mockAuthStore.setError).toHaveBeenCalledWith(expect.any(Error))
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })

  it('должен обрабатывать исключения при регистрации', async () => {
    const thrownError = new Error('Server error')
    mockAuthService.signUp = vi.fn().mockRejectedValue(thrownError)

    const userData: UserRegistrationData = {
      email: 'test@example.com',
      password: 'password123',
    }

    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    let authResult
    await act(async () => {
      authResult = await result.current.signUp(userData)
    })

    expect(authResult.isSuccess).toBe(false)
    expect(authResult.error?.message).toBe('Server error')
    expect(mockAuthStore.setError).toHaveBeenCalledWith(expect.any(Error))
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })

  it('должен обрабатывать ошибки при выходе', async () => {
    const logoutError = new Error('Logout failed')
    mockAuthService.logout = vi.fn().mockRejectedValue(logoutError)

    const { result } = renderHook(() => useAuth(mockAuthService, mockAuthStore))

    await act(async () => {
      await result.current.logout()
    })

    expect(mockAuthStore.setError).toHaveBeenCalledWith(expect.any(Error))
    expect(mockAuthStore.setAuthenticated).toHaveBeenCalledWith(false, null)
    expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false)
  })
})

/**
 * Тесты для AuthProvider
 * @module test/adapters/react/providers/auth-provider.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../../../src/adapters/react/providers/auth-provider'
import { AuthStore } from '../../../../src/adapters/store/auth-store'
import { AuthService } from '../../../../src/domain/services/auth.service'
import { AuthContext } from '../../../../src/adapters/react/providers/auth-context'
import React, { useContext } from 'react'

vi.mock('../../../../src/adapters/react/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    logout: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
  })),
}))

describe('AuthProvider', () => {
  let authStore: AuthStore
  let authService: AuthService
  let onInit: () => Promise<void>

  beforeEach(() => {
    authStore = new AuthStore()

    authService = {
      isAuthenticated: vi.fn(() => false),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    } as unknown as AuthService

    onInit = vi.fn().mockResolvedValue(undefined)

    vi.clearAllMocks()

    console.error = vi.fn()
  })

  const TestComponent = () => {
    const auth = useContext(AuthContext)
    return (
      <div>
        <div data-testid="auth-status">
          {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </div>
        <div data-testid="loading-status">{auth.isLoading ? 'Loading' : 'Not Loading'}</div>
      </div>
    )
  }

  it('должен рендерить дочерние компоненты', () => {
    render(
      <AuthProvider authService={authService} authStore={authStore}>
        <div data-testid="child">Child Component</div>
      </AuthProvider>,
    )

    const childElement = screen.getByTestId('child')
    expect(childElement).toBeDefined()
    expect(childElement.textContent).toBe('Child Component')
  })

  it('должен вызывать onInit при монтировании, если он предоставлен', async () => {
    render(
      <AuthProvider authService={authService} authStore={authStore} onInit={onInit}>
        <TestComponent />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(onInit).toHaveBeenCalled()
      expect(authService.isAuthenticated).not.toHaveBeenCalled()
    })
  })

  it('должен проверять статус аутентификации при монтировании, если onInit не предоставлен', async () => {
    render(
      <AuthProvider authService={authService} authStore={authStore}>
        <TestComponent />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(authService.isAuthenticated).toHaveBeenCalled()
      expect(onInit).not.toHaveBeenCalled()
    })
  })

  it('должен устанавливать статус аутентификации в хранилище', async () => {
    const setAuthenticatedSpy = vi.spyOn(authStore, 'setAuthenticated')
    vi.mocked(authService.isAuthenticated).mockReturnValue(true)

    render(
      <AuthProvider authService={authService} authStore={authStore}>
        <TestComponent />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(setAuthenticatedSpy).toHaveBeenCalledWith(true)
    })
  })

  it('должен обрабатывать ошибки при проверке статуса аутентификации', async () => {
    const error = new Error('Auth check failed')
    vi.mocked(authService.isAuthenticated).mockImplementation(() => {
      throw error
    })

    render(
      <AuthProvider authService={authService} authStore={authStore}>
        <TestComponent />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Ошибка при проверке статуса аутентификации:',
        error,
      )
    })
  })

  it('должен обрабатывать ошибки в onInit', async () => {
    const error = new Error('Init failed')
    const failingOnInit = vi.fn().mockRejectedValue(error)

    render(
      <AuthProvider authService={authService} authStore={authStore} onInit={failingOnInit}>
        <TestComponent />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Ошибка при проверке статуса аутентификации:',
        error,
      )
    })
  })
})

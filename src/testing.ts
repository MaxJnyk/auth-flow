/**
 * Экспорты для тестирования
 * @module testing
 */

// Экспорт утилит для тестирования
export * from './utils/validation'
export * from './utils/error-handling'

// Экспорт моков для тестирования
export const createMockAuthService = () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  resetPassword: vi.fn(),
  confirmPasswordReset: vi.fn(),
  isAuthenticated: vi.fn(),
})

export const createMockUserService = () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  changeEmail: vi.fn(),
  verifyEmail: vi.fn(),
})

export const createMockTwoFactorService = () => ({
  getAvailableMethods: vi.fn(),
  setupMethod: vi.fn(),
  confirmSetup: vi.fn(),
  disableMethod: vi.fn(),
  verifyCode: vi.fn(),
  sendCode: vi.fn(),
})

export const createMockTelegramAuthService = () => ({
  initSignIn: vi.fn(),
  handleAuthResult: vi.fn(),
})

export const createMockAuthStore = () => ({
  getState: vi.fn(),
  setState: vi.fn(),
  subscribe: vi.fn(),
  setAuthenticated: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
  reset: vi.fn(),
})

export const createMockUserStore = () => ({
  getState: vi.fn(),
  setState: vi.fn(),
  subscribe: vi.fn(),
  setUser: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
  reset: vi.fn(),
})

export const createMockTwoFactorStore = () => ({
  getState: vi.fn(),
  setState: vi.fn(),
  subscribe: vi.fn(),
  setRequired: vi.fn(),
  setAvailableMethods: vi.fn(),
  setSelectedMethod: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
  setSetupData: vi.fn(),
  reset: vi.fn(),
})

// Импортируем vi из vitest для моков
import { vi } from 'vitest'

/**
 * Тесты для хуков логирования
 * @module test/logging/react/logger-hooks.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useAuthLogger,
  useSecurityLogger,
  useComponentLogger,
} from '../../../src/logging/react/logger-hooks'
import { useLogger } from '../../../src/logging/react/logger-context'
import { AuthEvent, LogCategory, LogLevel } from '../../../src/logging/models'

vi.mock('../../../src/logging/react/logger-context', () => ({
  useLogger: vi.fn(),
}))

describe('Logger Hooks', () => {
  const mockLog = vi.fn()
  const mockLogAuth = vi.fn()
  const mockContext = { userId: 'test-user' }

  beforeEach(() => {
    vi.mocked(useLogger).mockReturnValue({
      logger: { log: mockLog } as any,
      logAuth: mockLogAuth,
      context: mockContext,
      updateContext: vi.fn(),
      log: mockLog,
      logSecurity: vi.fn(),
      logProfile: vi.fn(),
      enableLogging: vi.fn(),
      disableLogging: vi.fn(),
      isLoggingEnabled: true,
    })
    vi.clearAllMocks()
  })

  describe('useAuthLogger', () => {
    it('должен вызывать logAuth с правильными параметрами для logLogin', () => {
      const { result } = renderHook(() => useAuthLogger())
      act(() => {
        result.current.logLogin('user1', { ip: '127.0.0.1' })
      })
      expect(mockLogAuth).toHaveBeenCalledWith(
        AuthEvent.LOGIN_SUCCESS,
        { userId: 'user1', ip: '127.0.0.1' },
        true,
        LogLevel.INFO,
      )
    })

    it('должен вызывать logAuth для logLogout', () => {
      const { result } = renderHook(() => useAuthLogger())
      act(() => {
        result.current.logLogout('user1')
      })
      expect(mockLogAuth).toHaveBeenCalledWith(
        AuthEvent.LOGOUT,
        { userId: 'user1' },
        true,
        LogLevel.INFO,
      )
    })

    it('должен вызывать logAuth для logRegistration', () => {
      const { result } = renderHook(() => useAuthLogger())
      act(() => {
        result.current.logRegistration('user1')
      })
      expect(mockLogAuth).toHaveBeenCalledWith(
        AuthEvent.REGISTRATION_SUCCESS,
        { userId: 'user1' },
        true,
        LogLevel.INFO,
      )
    })

    it('должен вызывать logAuth для logPasswordReset', () => {
      const { result } = renderHook(() => useAuthLogger())
      act(() => {
        result.current.logPasswordReset('user1')
      })
      expect(mockLogAuth).toHaveBeenCalledWith(
        AuthEvent.PASSWORD_RESET_SUCCESS,
        { userId: 'user1' },
        true,
        LogLevel.INFO,
      )
    })

    it('должен вызывать logAuth для logPasswordChange', () => {
      const { result } = renderHook(() => useAuthLogger())
      act(() => {
        result.current.logPasswordChange('user1')
      })
      expect(mockLogAuth).toHaveBeenCalledWith(
        AuthEvent.PASSWORD_CHANGE,
        { userId: 'user1' },
        true,
        LogLevel.INFO,
      )
    })

    it('должен вызывать logAuth для log2FAUsage', () => {
      const { result } = renderHook(() => useAuthLogger())
      act(() => {
        result.current.log2FAUsage('user1', 'sms')
      })
      expect(mockLogAuth).toHaveBeenCalledWith(
        AuthEvent.TWO_FACTOR_VERIFY_SUCCESS,
        { userId: 'user1', method: 'sms' },
        true,
        LogLevel.INFO,
      )
    })
  })

  describe('useSecurityLogger', () => {
    it('должен вызывать logger.log для logUnauthorizedAccess', () => {
      const { result } = renderHook(() => useSecurityLogger())
      act(() => {
        result.current.logUnauthorizedAccess('admin-panel', { role: 'user' })
      })
      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          category: LogCategory.SECURITY,
          action: AuthEvent.PERMISSION_DENIED,
          details: { resource: 'admin-panel', role: 'user' },
        }),
        mockContext,
      )
    })

    it('должен вызывать logger.log для logSuspiciousActivity', () => {
      const { result } = renderHook(() => useSecurityLogger())
      act(() => {
        result.current.logSuspiciousActivity('multiple-failures')
      })
      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuthEvent.SUSPICIOUS_ACTIVITY,
          details: { activityType: 'multiple-failures' },
        }),
        mockContext,
      )
    })

    it('должен вызывать logger.log для logAccountLock', () => {
      const { result } = renderHook(() => useSecurityLogger())
      act(() => {
        result.current.logAccountLock('user1', 'brute-force')
      })
      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuthEvent.ACCOUNT_LOCK,
          details: { userId: 'user1', reason: 'brute-force' },
        }),
        mockContext,
      )
    })
  })

  describe('useComponentLogger', () => {
    it('должен логировать монтирование и размонтирование компонента', () => {
      const { unmount } = renderHook(() => useComponentLogger('TestComponent'))

      // Проверка лога монтирования
      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          details: { componentName: 'TestComponent', action: 'COMPONENT_MOUNT' },
        }),
        mockContext,
      )

      // Проверка лога размонтирования
      unmount()
      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          details: { componentName: 'TestComponent', action: 'COMPONENT_UNMOUNT' },
        }),
        mockContext,
      )
      expect(mockLog).toHaveBeenCalledTimes(2)
    })
  })
})

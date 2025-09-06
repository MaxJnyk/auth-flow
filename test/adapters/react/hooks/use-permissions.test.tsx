/**
 * Тесты для хука usePermissions
 * @module test/adapters/react/hooks/use-permissions.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermissions } from '../../../../src/adapters/react/hooks/use-permissions'
import { LoggerService } from '../../../../src/logging/services/logger.service'
import { UserProfile } from '../../../../src/domain/models/user.models'

vi.mock('../../../../src/adapters/react/hooks/use-user-context', () => ({
  useUserContext: vi.fn(),
}))

import { useUserContext } from '../../../../src/adapters/react/hooks/use-user-context'

describe('usePermissions', () => {
  let logger: LoggerService
  let mockUser: UserProfile

  beforeEach(() => {
    // Мокируем логгер
    logger = {
      log: vi.fn(),
    } as unknown as LoggerService

    mockUser = {
      id: 'user123',
      permissions: ['read', 'write', 'admin'],
    } as UserProfile
    ;(useUserContext as any).mockReturnValue({ user: mockUser })

    vi.clearAllMocks()
  })

  it('должен проверять наличие одного права у пользователя', () => {
    const { result } = renderHook(() => usePermissions(logger))

    const hasReadPermission = result.current.hasPermission('read')
    expect(hasReadPermission).toBe(true)

    const hasDeletePermission = result.current.hasPermission('delete')
    expect(hasDeletePermission).toBe(false)

    expect(logger.log).toHaveBeenCalledTimes(2)
  })

  it('должен проверять наличие любого из прав у пользователя', () => {
    const { result } = renderHook(() => usePermissions(logger))

    const hasAnyPermission = result.current.hasAnyPermission(['delete', 'read'])
    expect(hasAnyPermission).toBe(true)

    const hasNoPermission = result.current.hasAnyPermission(['delete', 'update'])
    expect(hasNoPermission).toBe(false)

    expect(logger.log).toHaveBeenCalledTimes(2)
  })

  it('должен проверять наличие всех прав у пользователя', () => {
    const { result } = renderHook(() => usePermissions(logger))

    const hasAllPermissions = result.current.hasAllPermissions(['read', 'write'])
    expect(hasAllPermissions).toBe(true)

    const hasNotAllPermissions = result.current.hasAllPermissions(['read', 'delete'])
    expect(hasNotAllPermissions).toBe(false)

    expect(logger.log).toHaveBeenCalledTimes(2)
  })

  it('должен возвращать список прав пользователя', () => {
    const { result } = renderHook(() => usePermissions(logger))
    expect(result.current.permissions).toEqual(['read', 'write', 'admin'])
  })

  it('должен возвращать пустой массив прав, если пользователь не авторизован', () => {
    // Мокируем отсутствие пользователя
    ;(useUserContext as any).mockReturnValue({ user: null })

    const { result } = renderHook(() => usePermissions(logger))
    expect(result.current.permissions).toEqual([])
  })

  it('должен корректно работать без логгера', () => {
    const { result } = renderHook(() => usePermissions())
    expect(() => result.current.hasPermission('read')).not.toThrow()
    expect(() => result.current.hasAnyPermission(['read'])).not.toThrow()
    expect(() => result.current.hasAllPermissions(['read'])).not.toThrow()
  })
})

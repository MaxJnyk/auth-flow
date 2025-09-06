/**
 * Тесты для утилит проверки прав
 * @module test/utils/permissions.test
 */

import { describe, it, expect } from 'vitest'
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../../src/utils/permissions'
import { UserProfile } from '../../src/domain/models/auth.models'

describe('Permissions Utils', () => {
  const userWithPermissions: UserProfile = {
    id: '1',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    permissions: ['read', 'write', 'delete'],
  }

  const userWithoutPermissions: UserProfile = {
    id: '2',
    email: 'no@perm.com',
    firstName: 'No',
    lastName: 'Permissions',
    permissions: [],
  }

  const nullUser: UserProfile | null = null

  describe('hasPermission', () => {
    it('должен возвращать true, если у пользователя есть право', () => {
      expect(hasPermission(userWithPermissions, 'read')).toBe(true)
    })

    it('должен возвращать false, если у пользователя нет права', () => {
      expect(hasPermission(userWithPermissions, 'admin')).toBe(false)
    })

    it('должен возвращать false, если у пользователя нет прав', () => {
      expect(hasPermission(userWithoutPermissions, 'read')).toBe(false)
    })

    it('должен возвращать false для null пользователя', () => {
      expect(hasPermission(nullUser, 'read')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('должен возвращать true, если у пользователя есть хотя бы одно из прав', () => {
      expect(hasAnyPermission(userWithPermissions, ['read', 'admin'])).toBe(true)
    })

    it('должен возвращать false, если у пользователя нет ни одного из прав', () => {
      expect(hasAnyPermission(userWithPermissions, ['admin', 'moderator'])).toBe(false)
    })

    it('должен возвращать false, если у пользователя нет прав', () => {
      expect(hasAnyPermission(userWithoutPermissions, ['read', 'write'])).toBe(false)
    })

    it('должен возвращать false для null пользователя', () => {
      expect(hasAnyPermission(nullUser, ['read'])).toBe(false)
    })

    it('должен возвращать false, если список запрашиваемых прав пуст', () => {
      expect(hasAnyPermission(userWithPermissions, [])).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('должен возвращать true, если у пользователя есть все права', () => {
      expect(hasAllPermissions(userWithPermissions, ['read', 'write'])).toBe(true)
    })

    it('должен возвращать false, если у пользователя нет хотя бы одного из прав', () => {
      expect(hasAllPermissions(userWithPermissions, ['read', 'admin'])).toBe(false)
    })

    it('должен возвращать false, если у пользователя нет прав', () => {
      expect(hasAllPermissions(userWithoutPermissions, ['read'])).toBe(false)
    })

    it('должен возвращать false для null пользователя', () => {
      expect(hasAllPermissions(nullUser, ['read'])).toBe(false)
    })

    it('должен возвращать false, если список запрашиваемых прав пуст', () => {
      expect(hasAllPermissions(userWithPermissions, [])).toBe(false)
    })
  })
})

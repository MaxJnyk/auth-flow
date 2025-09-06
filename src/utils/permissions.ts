import { UserProfile } from '@/domain/models/auth.models'

export function hasPermission(user: UserProfile | null, permission: string): boolean {
  return !!user?.permissions?.includes(permission)
}

export function hasAnyPermission(user: UserProfile | null, permissions: string[]): boolean {
  if (!user?.permissions || !user.permissions.length || !permissions.length) {
    return false
  }
  return user.permissions.some(p => permissions.includes(p))
}

export function hasAllPermissions(user: UserProfile | null, permissions: string[]): boolean {
  if (!user?.permissions || !permissions.length) {
    return false
  }
  return permissions.every(p => user.permissions?.includes(p))
}

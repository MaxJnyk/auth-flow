import React from 'react'
import { usePermissions } from '../hooks/use-permissions'

export interface PermissionGuardProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  const hasAccess = permission
    ? hasPermission(permission)
    : requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

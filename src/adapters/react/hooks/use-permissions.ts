import { useUserContext } from './use-user-context'
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../../../utils/permissions'
import { LoggerService } from '../../../logging/services/logger.service'
import { LogLevel, LogCategory, LogSource, AuthEvent } from '../../../logging/models'

export function usePermissions(logger?: LoggerService) {
  const { user } = useUserContext()

  return {
    hasPermission: (permission: string): boolean => {
      const result = hasPermission(user, permission)

      // Логируем проверку прав
      logger?.log({
        category: LogCategory.PERMISSIONS,
        action: AuthEvent.PERMISSION_CHECK,
        level: LogLevel.DEBUG,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
        details: {
          permission,
          userId: user?.id,
          result,
        },
        success: result,
      })

      return result
    },

    hasAnyPermission: (permissions: string[]): boolean => {
      const result = hasAnyPermission(user, permissions)

      // Логируем проверку прав
      logger?.log({
        category: LogCategory.PERMISSIONS,
        action: result ? AuthEvent.PERMISSION_GRANTED : AuthEvent.PERMISSION_DENIED,
        level: LogLevel.DEBUG,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
        details: {
          permissions,
          userId: user?.id,
          checkType: 'any',
          result,
        },
        success: result,
      })

      return result
    },

    hasAllPermissions: (permissions: string[]): boolean => {
      const result = hasAllPermissions(user, permissions)

      // Логируем проверку прав
      logger?.log({
        category: LogCategory.PERMISSIONS,
        action: result ? AuthEvent.PERMISSION_GRANTED : AuthEvent.PERMISSION_DENIED,
        level: LogLevel.DEBUG,
        source: LogSource.FRONTEND,
        timestamp: Date.now(),
        details: {
          permissions,
          userId: user?.id,
          checkType: 'all',
          result,
        },
        success: result,
      })

      return result
    },

    permissions: user?.permissions || [],
  }
}

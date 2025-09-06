/**
 * React адаптеры для auth-flow
 * @module adapters/react
 */

// Экспорт React хуков
export * from './hooks/use-store'
export * from './hooks/use-auth'
export * from './hooks/use-user'
export * from './hooks/use-two-factor'
export * from './hooks/use-auth-context'
export * from './hooks/use-user-context'
export * from './hooks/use-two-factor-context'
export * from './hooks/use-telegram-auth-context'
export * from './hooks/use-permissions'
export * from './hooks/useFingerprint'

// Явно реэкспортируем useTelegramAuth
import { useTelegramAuth } from './hooks/use-telegram-auth'
import type { TelegramTwoFactorState } from './hooks/use-telegram-auth'
export { useTelegramAuth }
export type { TelegramTwoFactorState }

// Экспорт React провайдеров
export * from './providers/auth-context'
export * from './providers/auth-provider'
export * from './providers/user-context'
export * from './providers/user-provider'
export * from './providers/two-factor-context'
export * from './providers/two-factor-provider'
export * from './providers/telegram-auth-context'
export * from './providers/telegram-auth-provider'
export * from './providers/auth-root-provider'

// Экспорт React компонентов
export * from './components/permission-guard'

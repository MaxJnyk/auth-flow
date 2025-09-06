/**
 * Библиотека аутентификации и управления профилем пользователя
 * @module auth-flow
 */

// Экспорт доменных моделей
export * from './domain/models/auth.models'

// Явно реэкспортируем модели пользователя
export type {
  UserProfile,
  ProfileUpdateData,
  PasswordChangeData,
  EmailChangeData,
  UserSession,
} from './domain/models/user.models'

// Экспорт интерфейсов сервисов
export * from './domain/services/auth.service'
export * from './domain/services/user.service'
export * from './domain/services/two-factor.service'
export * from './domain/services/telegram-auth'
export type { FingerprintService } from './domain/services/fingerprint.service'

// Экспорт реализаций сервисов
export * from './infrastructure/services/api-auth.service'
export * from './infrastructure/services/api-user.service'
export * from './infrastructure/services/api-two-factor.service'
export * from './infrastructure/services/api-telegram-auth.service'
export { FingerprintJsService } from './infrastructure/services/fingerprint.service'

// Экспорт хранилищ состояния
export * from './adapters/store/store.interface'
export * from './adapters/store/simple-store'
export * from './adapters/store/auth-store'
export * from './adapters/store/user-store'
export { TwoFactorStore } from './adapters/store/two-factor-store'
export type { TwoFactorState } from './adapters/store/two-factor-store'

// Экспорт конфигурации
export type { AuthConfig } from './config/auth-config'

// Экспорт субпутей для более гранулярного импорта

// Для совместимости с существующим кодом экспортируем и из корня

// HTTP клиент
export * from './infrastructure/http/http-client.interface'
export * from './infrastructure/http/axios-http-client'

// API адаптеры
export { FingerprintApiAdapter } from './adapters/api/fingerprint/api'
export type {
  SendFingerprintPayload,
  SendFingerprintResponse,
} from './adapters/api/fingerprint/models'

// Хранилища токенов
export * from './infrastructure/storage/token-storage.interface'
export * from './infrastructure/storage/local-storage-token-storage'
export * from './infrastructure/storage/cookie-token-storage'

// React хуки и компоненты
export * from './adapters/react/hooks/use-store'
export * from './adapters/react/hooks/use-auth'
export * from './adapters/react/hooks/use-user'
export * from './adapters/react/hooks/use-two-factor'
export { useTelegramAuth } from './adapters/react/hooks/use-telegram-auth'
export type { TelegramTwoFactorState } from './adapters/react/hooks/use-telegram-auth'
export * from './adapters/react/hooks/use-auth-context'
export * from './adapters/react/hooks/use-user-context'
export * from './adapters/react/hooks/use-two-factor-context'
export * from './adapters/react/hooks/use-telegram-auth-context'
export * from './adapters/react/hooks/use-permissions'
export { useFingerprint } from './adapters/react/hooks/useFingerprint'
export type { UseFingerprintOptions, FingerprintData } from './adapters/react/hooks/useFingerprint'

// React провайдеры
export * from './adapters/react/providers/auth-context'
export * from './adapters/react/providers/auth-provider'
export * from './adapters/react/providers/user-context'
export * from './adapters/react/providers/user-provider'
export * from './adapters/react/providers/two-factor-context'
export * from './adapters/react/providers/two-factor-provider'
export * from './adapters/react/providers/telegram-auth-context'
export * from './adapters/react/providers/telegram-auth-provider'
export * from './adapters/react/providers/auth-root-provider'
export {
  FingerprintProvider,
  useFingerPrintContext,
} from './adapters/react/providers/FingerprintProvider'
export type { FingerprintProviderProps } from './adapters/react/providers/FingerprintProvider'

// React компоненты
export * from './adapters/react/components/permission-guard'

// Утилиты
export * from './utils/validation'
export * from './utils/error-handling'
export * from './utils/permissions'

// Аналитика и логирование
export type { YandexMetrikaService, AnalyticsEventPayload } from './logging/models/analytics.models'
export { AnalyticsApiService } from './logging/services/analytics-api.service'
export * from './logging/adapters/metrika-logger.adapter'
export * from './logging/factories/analytics.factory'
export { FingerprintLoggerService } from './logging/services/fingerprint-logger.service'

// Константы для Яндекс.Метрики
export { MetrikaEvent } from './logging/constants/metrika-events'
export { metrikaEventMap } from './logging/constants/metrika-event-map'
export { YM_GOALS } from './logging/constants/metrika-goals'

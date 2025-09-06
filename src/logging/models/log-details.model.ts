import { AuthEvent } from './auth-events.enum'
import { LogCategory } from './log-category.enum'

export interface BaseLogDetails {
  category?: LogCategory
  action?: string | AuthEvent
  timestamp?: number
  correlationId?: string
  [key: string]: string | number | boolean | undefined | string[] | unknown[]
}

export interface AuthLogDetails extends BaseLogDetails {
  userId?: string
  email?: string
  method?: string
  provider?: string
  success?: boolean
}

export interface SecurityLogDetails extends BaseLogDetails {
  userId?: string
  methodType?: string
  reason?: string
  attempt?: number
  maxAttempts?: number
  //Для логирования Telegram аутентификации
  type?: string
  // Вместо вложенного объекта details используем отдельные свойства
  id?: boolean | string | number
  firstName?: boolean
  authDate?: number
  hash?: boolean
  now?: number
  diff?: number
  error?: string
  // Дополнительные свойства для совместимости с TwoFactorLogDetails
  telegramId?: string | number
}

export interface SystemLogDetails extends BaseLogDetails {
  component?: string
  service?: string
  operation?: string
  duration?: number
}

export interface AnalyticsLogDetails extends BaseLogDetails {
  eventName?: string
  eventType?: string
  value?: number
  label?: string
}

export type LogDetails =
  | AuthLogDetails
  | SecurityLogDetails
  | SystemLogDetails
  | AnalyticsLogDetails
  | BaseLogDetails

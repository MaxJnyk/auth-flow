import { TwoFactorMethodType } from '../../domain/models/auth.models'
import { BaseLogDetails } from './log-details.model'

export interface TwoFactorLogDetails extends BaseLogDetails {
  methodType?: TwoFactorMethodType
  methodId?: string
  correlationId?: string
  error?: string
  telegramAuthResult?: boolean
  telegramUserId?: number
  stage?: string
  widgetId?: string
  methodsCount?: number
  methodTypes?: string
  //свойства для аутентификации Telegram
  // Используем другое название свойства, чтобы избежать конфликта типов
  telegramId?: string | number
  userId?: string
  username?: string
}

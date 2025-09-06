import { LogCategory } from './log-category.enum'
import { LogLevel } from './log-level.enum'
import { LogSource } from './log-source.enum'
import { AuthEvent } from './auth-events.enum'
import { LogDetails } from './log-details.model'

export interface LogEvent {
  category: LogCategory
  action: string | AuthEvent
  level: LogLevel
  source: LogSource
  details?: LogDetails
  success?: boolean
  timestamp?: number
  correlationId?: string
}

import { LogContext, LogEvent } from '../models'

export interface LoggerAdapter {
  log(event: LogEvent, context: LogContext): void
  batchLog?(events: LogEvent[], context: LogContext): void
  supports(event: LogEvent): boolean
}

import { LogEvent } from './models/log-event.model'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LoggerService {
  debug(message: string, context?: Partial<LogEvent>): void
  info(message: string, context?: Partial<LogEvent>): void
  warn(message: string, context?: Partial<LogEvent>): void
  error(message: string, error?: Error | unknown, context?: Partial<LogEvent>): void
  setLevel(level: LogLevel): void
}

export enum LogLevel {
  CRITICAL = 'critical',
  IMPORTANT = 'important',
  INFO = 'info',
  DEBUG = 'debug',
}

export const LogLevelSeverity: Record<LogLevel, number> = {
  [LogLevel.CRITICAL]: 4,
  [LogLevel.IMPORTANT]: 3,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 1,
}

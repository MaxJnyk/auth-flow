import { LogContext, LogEvent, LogLevel, LogLevelSeverity, LogSource } from '../models'
import { LoggerAdapter } from '../adapters'

export interface LoggerOptions {
  logEnabled?: boolean
  minLevel?: LogLevel
  defaultContext?: Partial<LogContext>
}

export class LoggerService {
  private adapters: LoggerAdapter[] = []
  private options: LoggerOptions = {
    logEnabled: true,
    minLevel: LogLevel.INFO,
    defaultContext: {},
  }

  constructor(adapters: LoggerAdapter[] = [], options: LoggerOptions = {}) {
    this.adapters = adapters
    this.options = { ...this.options, ...options }
  }

  addAdapter(adapter: LoggerAdapter): void {
    this.adapters.push(adapter)
  }

  log(event: LogEvent, context?: Partial<LogContext>): void {
    if (!this.options.logEnabled && event.level !== LogLevel.CRITICAL) {
      return
    }

    const minLevel = this.options.minLevel || LogLevel.INFO
    if (LogLevelSeverity[event.level] < LogLevelSeverity[minLevel]) {
      return
    }

    if (!event.source) {
      console.warn('LogEvent missing required field: source')
      event.source = LogSource.FRONTEND
    }

    if (!event.timestamp) {
      event.timestamp = Date.now()
    }

    const fullContext = this.buildContext(context)

    this.adapters.forEach(adapter => {
      if (adapter.supports(event)) {
        try {
          adapter.log(event, fullContext)
        } catch (error) {
          console.error('Error in logger adapter:', error)
        }
      }
    })
  }

  batchLog(events: LogEvent[], context?: Partial<LogContext>): void {
    const minLevel = this.options.minLevel || LogLevel.INFO
    const filteredEvents = events.filter(event => {
      return (
        (this.options.logEnabled || event.level === LogLevel.CRITICAL) &&
        LogLevelSeverity[event.level] >= LogLevelSeverity[minLevel]
      )
    })

    if (filteredEvents.length === 0) {
      return
    }

    const eventsWithTimestamp = filteredEvents.map(event => ({
      ...event,
      timestamp: event.timestamp || Date.now(),
      source: event.source || LogSource.FRONTEND,
    }))

    const fullContext = this.buildContext(context)

    this.adapters.forEach(adapter => {
      const supportedEvents = eventsWithTimestamp.filter(event => adapter.supports(event))

      if (supportedEvents.length > 0) {
        try {
          if (adapter.batchLog) {
            adapter.batchLog(supportedEvents, fullContext)
          } else {
            supportedEvents.forEach(event => adapter.log(event, fullContext))
          }
        } catch (error) {
          console.error('Error in logger adapter batch processing:', error)
        }
      }
    })
  }

  updateOptions(options: LoggerOptions): void {
    this.options = { ...this.options, ...options }
  }

  enable(): void {
    this.options.logEnabled = true
  }

  disable(): void {
    this.options.logEnabled = false
  }

  setMinLevel(level: LogLevel): void {
    this.options.minLevel = level
  }

  updateDefaultContext(context: Partial<LogContext>): void {
    this.options.defaultContext = { ...this.options.defaultContext, ...context }
  }

  private buildContext(additionalContext?: Partial<LogContext>): LogContext {
    const baseContext = this.options.defaultContext || {}
    const mergedContext = { ...baseContext, ...additionalContext }

    return {
      userId: mergedContext.userId || 'anonymous',
      sessionId: mergedContext.sessionId || this.generateSessionId(),
      fingerprint: mergedContext.fingerprint || '',
      ipAddress: mergedContext.ipAddress || '',
      geoLocation: mergedContext.geoLocation || undefined,
      deviceInfo: mergedContext.deviceInfo || undefined,
      interfaceType: mergedContext.interfaceType || undefined,
      using2FA: mergedContext.using2FA || false,
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}

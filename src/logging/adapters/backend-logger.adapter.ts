import { LogCategory, LogContext, LogEvent, LogLevel } from '../models'
import { LoggerAdapter } from './logger.adapter'
import { AnalyticsApiService, AnalyticsEventPayload } from '../models/analytics.models'

export class BackendLoggerAdapter implements LoggerAdapter {
  constructor(private apiClient: AnalyticsApiService) {}

  log(event: LogEvent, context: LogContext): void {
    const payload: AnalyticsEventPayload = {
      event: this.mapEventToString(event),
      value: {
        ...event.details,
        success: event.success,
        level: event.level,
      },
      fire_at: event.timestamp || Date.now(),
      source: 'user',
      extra: JSON.stringify(this.extractContextData(context)),
    }

    this.apiClient.postAnalyticsEvent([payload]).catch(error => {
      console.error('Failed to send log event to backend:', error)
    })
  }

  batchLog(events: LogEvent[], context: LogContext): void {
    const payloads: AnalyticsEventPayload[] = events.map(event => ({
      event: this.mapEventToString(event),
      value: {
        ...event.details,
        success: event.success,
        level: event.level,
      },
      fire_at: event.timestamp || Date.now(),
      source: 'user',
      extra: JSON.stringify(this.extractContextData(context)),
    }))

    this.apiClient.postAnalyticsEvent(payloads).catch(error => {
      console.error('Failed to send batch log events to backend:', error)
    })
  }

  supports(event: LogEvent): boolean {
    return event.level !== LogLevel.DEBUG
  }

  private mapEventToString(event: LogEvent): string {
    const categoryName = LogCategory[event.category] || 'unknown'
    return `${categoryName.toLowerCase()}.${event.action}`
  }

  private extractContextData(context: LogContext): Record<string, unknown> {
    const {
      userId,
      sessionId,
      fingerprint,
      ipAddress,
      geoLocation,
      deviceInfo,
      interfaceType,
      using2FA,
    } = context

    return {
      userId,
      sessionId,
      fingerprint,
      ipAddress,
      geoLocation,
      deviceInfo,
      interfaceType,
      using2FA,
    }
  }
}

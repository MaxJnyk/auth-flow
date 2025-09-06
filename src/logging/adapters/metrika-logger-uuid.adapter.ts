import { LogContext, LogEvent, LogLevel } from '../models'
import { LoggerAdapter } from './logger.adapter'
import {
  YandexMetrikaService,
  AnalyticsApiService,
  AnalyticsEventPayload,
} from '../models/analytics.models'
import { MetrikaEvent } from '../constants/metrika-events'
import { YM_GOALS } from '../constants/metrika-goals'

export class MetrikaLoggerUuidAdapter implements LoggerAdapter {
  private eventQueue: AnalyticsEventPayload[] = []
  private debounceTimer: NodeJS.Timeout | null = null
  private readonly DEBOUNCE_TIME = 2000

  constructor(
    private metrikaEventMap: Record<string, MetrikaEvent>,
    private metrikaService: YandexMetrikaService,
    private analyticsApiService?: AnalyticsApiService,
    private isEnabled: boolean = true,
  ) {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer)
          this.processEventQueue()
        }
      })
    }
  }

  private logEvent(type: string, event: string, payload?: Record<string, any>): void {
    if (!this.isEnabled) {
      console.log(`%c[YandexMetrika](${type})`, `color: orange`, event, payload)
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.analyticsApiService) return

    try {
      for (const event of [...this.eventQueue]) {
        await this.analyticsApiService.postAnalyticsEvent([event])
      }
      this.eventQueue.length = 0
    } catch (error) {
      console.error('Failed to send analytics events:', error)
    }
  }

  private queueEvent(eventPayload: AnalyticsEventPayload): void {
    this.eventQueue.push(eventPayload)

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => this.processEventQueue(), this.DEBOUNCE_TIME)
  }

  private pointYandexGoal(metrikaEvent: MetrikaEvent, payload?: Record<string, any>): void {
    const goalId = YM_GOALS[metrikaEvent]

    if (!goalId) {
      console.warn(`No goal ID mapping for metrika event: ${metrikaEvent}`)
      return
    }

    this.logEvent('GOAL', goalId, payload)

    if (this.isEnabled) {
      try {
        this.metrikaService.reachGoal(goalId, payload)
      } catch (error) {
        console.error('Failed to reach Yandex Metrika goal:', error)
      }
    }
  }

  private fireAnalyticsEvent(metrikaEvent: MetrikaEvent, payload?: Record<string, any>): void {
    const goalId = YM_GOALS[metrikaEvent]
    this.logEvent('EVENT', goalId || String(metrikaEvent), payload)

    this.queueEvent({
      event: String(metrikaEvent), // UUID события
      goal: goalId, // ID цели в Яндекс.Метрике для совместимости с основным проектом
      value: payload,
      fire_at: Date.now(),
      source: 'user',
    })
  }

  log(event: LogEvent, context: LogContext): void {
    const eventKey = `${event.category}.${event.action}`
    const metrikaEvent = this.metrikaEventMap[eventKey]

    if (!metrikaEvent) {
      console.warn(`No metrika event mapping for ${eventKey}`)
      return
    }

    const payload = {
      ...event.details,
      userId: context.userId,
      success: event.success,
      level: event.level,
      timestamp: event.timestamp || Date.now(),
    }

    // Отправляем событие в Яндекс.Метрику
    this.pointYandexGoal(metrikaEvent, payload)

    // Отправляем событие на сервер аналитики
    if (this.analyticsApiService) {
      this.fireAnalyticsEvent(metrikaEvent, payload)
    }
  }

  supports(event: LogEvent): boolean {
    if (event.level === LogLevel.DEBUG) {
      return false
    }
    const eventKey = `${event.category}.${event.action}`
    return !!this.metrikaEventMap[eventKey]
  }

  batchLog(events: LogEvent[], context: LogContext): void {
    events.forEach(event => this.log(event, context))
  }

  trackEvent(metrikaEvent: MetrikaEvent, payload?: Record<string, any>): void {
    this.pointYandexGoal(metrikaEvent, payload)
    this.fireAnalyticsEvent(metrikaEvent, payload)
  }
}

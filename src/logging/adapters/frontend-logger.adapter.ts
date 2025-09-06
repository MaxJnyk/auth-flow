import { LogContext, LogEvent, LogLevel } from '../models'
import { LoggerAdapter } from './logger.adapter'

export class FrontendLoggerAdapter implements LoggerAdapter {
  private eventQueue: Array<{ event: LogEvent; context: LogContext }> = []
  private maxQueueSize: number = 100

  constructor(
    private storage?: Storage,
    private queueKey: string = 'auth_log_queue',
  ) {
    if (typeof localStorage !== 'undefined') {
      this.storage = localStorage
    }
    this.loadQueue()
  }

  log(event: LogEvent, context: LogContext): void {
    this.addToQueue(event, context)
    this.logToConsole(event)
  }

  batchLog(events: LogEvent[], context: LogContext): void {
    events.forEach(evt => {
      this.addToQueue(evt, context)
      this.logToConsole(evt)
    })
  }

  supports(_event: LogEvent): boolean {
    return true
  }

  async synchronize(
    syncCallback: (events: LogEvent[], context: LogContext) => Promise<void>,
  ): Promise<void> {
    if (this.eventQueue.length === 0) {
      return
    }

    const groupedEvents = this.groupByContext()

    try {
      for (const [, group] of Object.entries(groupedEvents)) {
        await syncCallback(group.events, group.context)
      }

      this.eventQueue = []
      this.saveQueue()
    } catch (error) {
      console.error('Failed to synchronize log events:', error)
    }
  }

  getQueueSize(): number {
    return this.eventQueue.length
  }

  clearQueue(): void {
    this.eventQueue = []
    this.saveQueue()
  }

  private addToQueue(event: LogEvent, context: LogContext): void {
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.eventQueue.shift()
    }

    this.eventQueue.push({ event, context })
    this.saveQueue()
  }

  private groupByContext(): Record<string, { events: LogEvent[]; context: LogContext }> {
    const groups: Record<string, { events: LogEvent[]; context: LogContext }> = {}

    this.eventQueue.forEach(({ event, context }) => {
      const key = context.userId || 'anonymous'

      if (!groups[key]) {
        groups[key] = { events: [], context }
      }

      groups[key].events.push(event)
    })

    return groups
  }

  private logToConsole(event: LogEvent): void {
    console.log(
      `%c[Logger][${event.category}][${event.level}]`,
      `color: ${this.getLevelColor(event.level)}`,
      event.action,
      event.details,
    )
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.CRITICAL:
        return 'red'
      case LogLevel.IMPORTANT:
        return 'orange'
      case LogLevel.INFO:
        return 'blue'
      case LogLevel.DEBUG:
        return 'gray'
    }
  }

  private loadQueue(): void {
    if (!this.storage) return

    try {
      const savedQueue = this.storage.getItem(this.queueKey)
      if (savedQueue) {
        this.eventQueue = JSON.parse(savedQueue)
      }
    } catch (error) {
      console.error('Failed to load log queue from storage:', error)
      this.eventQueue = []
    }
  }

  private saveQueue(): void {
    if (!this.storage) return

    try {
      this.storage.setItem(this.queueKey, JSON.stringify(this.eventQueue))
    } catch (error) {
      console.error('Failed to save log queue to storage:', error)
    }
  }
}

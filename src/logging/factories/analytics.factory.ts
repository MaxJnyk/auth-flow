import { LoggerService } from '../services/logger.service'
import { LoggerAdapter } from '../adapters/logger.adapter'
import { MetrikaLoggerAdapter } from '../adapters/metrika-logger.adapter'
import {
  YandexMetrikaService,
  AnalyticsApiService as IAnalyticsApiService,
} from '../models/analytics.models'
import { metrikaEventMap } from '../constants/metrika-event-map'
import { FrontendLoggerAdapter } from '../adapters/frontend-logger.adapter'
import { BackendLoggerAdapter } from '../adapters/backend-logger.adapter'
import { AnalyticsApiService } from '../services/analytics-api.service'

export interface AnalyticsConfig {
  apiUrl?: string
  metrikaEnabled?: boolean
  metrikaId?: number
  consoleLoggingEnabled?: boolean
  apiLoggingEnabled?: boolean
}

export class AnalyticsFactory {
  private static createMetrikaService(metrikaId?: number): YandexMetrikaService | null {
    if (!metrikaId || typeof window === 'undefined') {
      return null
    }

    const ym = (window as any).ym
    if (!ym) {
      console.warn('Yandex Metrika not found in global context')
      return null
    }

    return {
      reachGoal: (goal: string, params?: Record<string, any>) => {
        try {
          ym(metrikaId, 'reachGoal', goal, params)
        } catch (error) {
          console.error('Failed to reach Yandex Metrika goal:', error)
        }
      },
    }
  }

  private static createAnalyticsApiService(apiUrl?: string): IAnalyticsApiService | undefined {
    if (!apiUrl) {
      return undefined
    }
    return new AnalyticsApiService(apiUrl)
  }

  static createAnalytics(config: AnalyticsConfig = {}): LoggerService {
    const adapters: LoggerAdapter[] = []
    const metrikaService = this.createMetrikaService(config.metrikaId)
    const analyticsApiService = this.createAnalyticsApiService(config.apiUrl)

    if (config.metrikaEnabled !== false && metrikaService) {
      adapters.push(
        new MetrikaLoggerAdapter(
          metrikaEventMap,
          metrikaService,
          analyticsApiService,
          config.metrikaEnabled,
        ),
      )
    }
    if (config.consoleLoggingEnabled !== false) {
      adapters.push(new FrontendLoggerAdapter())
    }
    if (config.apiLoggingEnabled !== false && analyticsApiService) {
      adapters.push(new BackendLoggerAdapter(analyticsApiService))
    }
    return new LoggerService(adapters)
  }
}

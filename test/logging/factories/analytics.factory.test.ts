/**
 * Тесты для AnalyticsFactory
 * @module test/logging/factories/analytics.factory.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalyticsFactory, AnalyticsConfig } from '../../../src/logging/factories/analytics.factory'
import { LoggerService } from '../../../src/logging/services'
import {
  MetrikaLoggerAdapter,
  FrontendLoggerAdapter,
  BackendLoggerAdapter,
} from '../../../src/logging/adapters'

vi.mock('../../../src/logging/services/logger.service')
vi.mock('../../../src/logging/adapters/metrika-logger.adapter')
vi.mock('../../../src/logging/adapters/frontend-logger.adapter')
vi.mock('../../../src/logging/adapters/backend-logger.adapter')
vi.mock('../../../src/logging/services/analytics-api.service')

describe('AnalyticsFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.window = { ym: vi.fn() } as any
  })

  it('должен создавать LoggerService с FrontendLoggerAdapter по умолчанию', () => {
    AnalyticsFactory.createAnalytics()
    expect(LoggerService).toHaveBeenCalledWith([expect.any(FrontendLoggerAdapter)])
  })

  it('должен создавать MetrikaLoggerAdapter, если metrikaEnabled и есть metrikaId', () => {
    const config: AnalyticsConfig = { metrikaEnabled: true, metrikaId: 123 }
    AnalyticsFactory.createAnalytics(config)
    expect(MetrikaLoggerAdapter).toHaveBeenCalled()
    expect(LoggerService).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(MetrikaLoggerAdapter)]),
    )
  })

  it('не должен создавать MetrikaLoggerAdapter, если metrikaId отсутствует', () => {
    const config: AnalyticsConfig = { metrikaEnabled: true }
    AnalyticsFactory.createAnalytics(config)
    expect(MetrikaLoggerAdapter).not.toHaveBeenCalled()
  })

  it('не должен создавать MetrikaLoggerAdapter, если metrikaEnabled: false', () => {
    const config: AnalyticsConfig = { metrikaEnabled: false, metrikaId: 123 }
    AnalyticsFactory.createAnalytics(config)
    expect(MetrikaLoggerAdapter).not.toHaveBeenCalled()
  })

  it('должен создавать BackendLoggerAdapter, если apiLoggingEnabled и есть apiUrl', () => {
    const config: AnalyticsConfig = { apiLoggingEnabled: true, apiUrl: 'https://api.test' }
    AnalyticsFactory.createAnalytics(config)
    expect(BackendLoggerAdapter).toHaveBeenCalled()
    expect(LoggerService).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(BackendLoggerAdapter)]),
    )
  })

  it('не должен создавать BackendLoggerAdapter, если apiUrl отсутствует', () => {
    const config: AnalyticsConfig = { apiLoggingEnabled: true }
    AnalyticsFactory.createAnalytics(config)
    expect(BackendLoggerAdapter).not.toHaveBeenCalled()
  })

  it('не должен создавать FrontendLoggerAdapter, если consoleLoggingEnabled: false', () => {
    const config: AnalyticsConfig = { consoleLoggingEnabled: false }
    AnalyticsFactory.createAnalytics(config)
    expect(FrontendLoggerAdapter).not.toHaveBeenCalled()
  })

  it('должен создавать все адаптеры при полной конфигурации', () => {
    const config: AnalyticsConfig = {
      metrikaEnabled: true,
      metrikaId: 123,
      apiLoggingEnabled: true,
      apiUrl: 'https://api.test',
      consoleLoggingEnabled: true,
    }
    AnalyticsFactory.createAnalytics(config)

    expect(LoggerService).toHaveBeenCalledWith([
      expect.any(MetrikaLoggerAdapter),
      expect.any(FrontendLoggerAdapter),
      expect.any(BackendLoggerAdapter),
    ])
  })

  it('должен возвращать LoggerService без адаптеров, если все отключено', () => {
    const config: AnalyticsConfig = {
      metrikaEnabled: false,
      apiLoggingEnabled: false,
      consoleLoggingEnabled: false,
    }
    AnalyticsFactory.createAnalytics(config)
    expect(LoggerService).toHaveBeenCalledWith([])
  })
})

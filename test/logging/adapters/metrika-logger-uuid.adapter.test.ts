/**
 * Тесты для MetrikaLoggerUuidAdapter
 * @module test/logging/adapters/metrika-logger-uuid.adapter.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MetrikaLoggerUuidAdapter } from '../../../src/logging/adapters/metrika-logger-uuid.adapter'
import { LogEvent, LogLevel, LogCategory, LogSource } from '../../../src/logging/models'
import {
  YandexMetrikaService,
  AnalyticsApiService,
} from '../../../src/logging/models/analytics.models'
import { LogContext } from '../../../src/logging/models/log-context.model'
import * as MetrikaGoals from '../../../src/logging/constants/metrika-goals'
import { MetrikaEvent } from '../../../src/logging/constants/metrika-events'

const createMockMetrikaService = (): YandexMetrikaService => ({
  reachGoal: vi.fn(),
})

const createMockAnalyticsService = (): AnalyticsApiService => ({
  postAnalyticsEvent: vi.fn(() => Promise.resolve()),
})

describe('MetrikaLoggerUuidAdapter', () => {
  let adapter: MetrikaLoggerUuidAdapter
  let mockMetrikaService: YandexMetrikaService
  let mockAnalyticsService: AnalyticsApiService
  const metrikaEventMap = {
    [`${LogCategory.SYSTEM}.test_action`]: MetrikaEvent.LOGIN_SUCCESS,
  }

  beforeEach(() => {
    vi.useFakeTimers()
    mockMetrikaService = createMockMetrikaService()
    mockAnalyticsService = createMockAnalyticsService()

    // Мокаем YM_GOALS
    vi.spyOn(MetrikaGoals, 'YM_GOALS', 'get').mockReturnValue({
      [MetrikaEvent.LOGIN_SUCCESS]: 'goal123',
    } as Record<MetrikaEvent, string>)

    adapter = new MetrikaLoggerUuidAdapter(
      metrikaEventMap,
      mockMetrikaService,
      mockAnalyticsService,
    )
    console.warn = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const createTestEvent = (): LogEvent => ({
    level: LogLevel.INFO,
    category: LogCategory.SYSTEM,
    action: 'test_action',
    source: LogSource.FRONTEND,
    timestamp: Date.now(),
    success: true,
    details: { custom: 'data' },
  })

  const createTestContext = (): LogContext => ({ userId: 'user-123' })

  describe('log', () => {
    it('должен вызывать reachGoal с ID цели и fireAnalyticsEvent с UUID', () => {
      const event = createTestEvent()
      const context = createTestContext()

      adapter.log(event, context)

      expect(mockMetrikaService.reachGoal).toHaveBeenCalledWith('goal123', expect.any(Object))

      vi.advanceTimersByTime(2000)
      expect(mockAnalyticsService.postAnalyticsEvent).toHaveBeenCalledWith([
        expect.objectContaining({
          event: MetrikaEvent.LOGIN_SUCCESS,
          goal: 'goal123',
        }),
      ])
    })

    it('должен выводить предупреждение, если ID цели не найден', () => {
      vi.spyOn(MetrikaGoals, 'YM_GOALS', 'get').mockReturnValue({} as Record<MetrikaEvent, string>)
      const event = createTestEvent()
      adapter.log(event, createTestContext())

      expect(console.warn).toHaveBeenCalledWith(
        `No goal ID mapping for metrika event: ${MetrikaEvent.LOGIN_SUCCESS}`,
      )
      expect(mockMetrikaService.reachGoal).not.toHaveBeenCalled()
    })
  })

  describe('trackEvent', () => {
    it('должен вызывать reachGoal и fireAnalyticsEvent с правильными параметрами', () => {
      adapter.trackEvent(MetrikaEvent.LOGIN_SUCCESS, { custom: 'payload' })

      expect(mockMetrikaService.reachGoal).toHaveBeenCalledWith('goal123', { custom: 'payload' })

      vi.advanceTimersByTime(2000)
      expect(mockAnalyticsService.postAnalyticsEvent).toHaveBeenCalledWith([
        expect.objectContaining({
          event: MetrikaEvent.LOGIN_SUCCESS,
          goal: 'goal123',
          value: { custom: 'payload' },
        }),
      ])
    })
  })
})

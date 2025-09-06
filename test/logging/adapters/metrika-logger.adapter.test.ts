/**
 * Тесты для MetrikaLoggerAdapter
 * @module test/logging/adapters/metrika-logger.adapter.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MetrikaLoggerAdapter } from '../../../src/logging/adapters/metrika-logger.adapter'
import { LogEvent, LogLevel, LogCategory, LogSource } from '../../../src/logging/models'
import {
  YandexMetrikaService,
  AnalyticsApiService,
} from '../../../src/logging/models/analytics.models'
import { LogContext } from '../../../src/logging/models/log-context.model'

const createMockMetrikaService = (): YandexMetrikaService => ({
  reachGoal: vi.fn(),
})

const createMockAnalyticsService = (): AnalyticsApiService => ({
  postAnalyticsEvent: vi.fn(() => Promise.resolve()),
})

describe('MetrikaLoggerAdapter', () => {
  let adapter: MetrikaLoggerAdapter
  let mockMetrikaService: YandexMetrikaService
  let mockAnalyticsService: AnalyticsApiService
  const metrikaEventMap = {
    [`${LogCategory.SYSTEM}.test_action`]: 'METRIKA_TEST_EVENT',
  }

  beforeEach(() => {
    vi.useFakeTimers()
    mockMetrikaService = createMockMetrikaService()
    mockAnalyticsService = createMockAnalyticsService()
    adapter = new MetrikaLoggerAdapter(metrikaEventMap, mockMetrikaService, mockAnalyticsService)
    console.warn = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createTestEvent = (level: LogLevel = LogLevel.INFO): LogEvent => ({
    level,
    category: LogCategory.SYSTEM,
    action: 'test_action',
    source: LogSource.FRONTEND,
    timestamp: Date.now(),
    success: true,
    details: { custom: 'data' },
  })

  const createTestContext = (): LogContext => ({ userId: 'user-123' })

  describe('log', () => {
    it('должен вызывать reachGoal и fireAnalyticsEvent для сопоставленного события', () => {
      const event = createTestEvent()
      const context = createTestContext()

      adapter.log(event, context)

      expect(mockMetrikaService.reachGoal).toHaveBeenCalledWith(
        'METRIKA_TEST_EVENT',
        expect.any(Object),
      )
      // Проверяем, что событие было добавлено в очередь для отправки
      vi.advanceTimersByTime(2000) // Проматываем таймер для debounce
      expect(mockAnalyticsService.postAnalyticsEvent).toHaveBeenCalled()
    })

    it('должен выводить предупреждение, если нет сопоставления для события', () => {
      const event = { ...createTestEvent(), action: 'unmapped_action' }
      adapter.log(event, createTestContext())

      expect(console.warn).toHaveBeenCalledWith('No metrika event mapping for 4.unmapped_action')
      expect(mockMetrikaService.reachGoal).not.toHaveBeenCalled()
    })
  })

  describe('supports', () => {
    it('должен возвращать true для поддерживаемого события', () => {
      const event = createTestEvent()
      expect(adapter.supports(event)).toBe(true)
    })

    it('должен возвращать false для уровня DEBUG', () => {
      const event = createTestEvent(LogLevel.DEBUG)
      expect(adapter.supports(event)).toBe(false)
    })

    it('должен возвращать false для несопоставленного события', () => {
      const event = { ...createTestEvent(), category: LogCategory.AUTH }
      expect(adapter.supports(event)).toBe(false)
    })
  })

  describe('batchLog', () => {
    it('должен вызывать log для каждого события в пакете', () => {
      const logSpy = vi.spyOn(adapter, 'log')
      const events = [createTestEvent(), createTestEvent()]
      const context = createTestContext()

      adapter.batchLog(events, context)

      expect(logSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('trackEvent', () => {
    it('должен напрямую вызывать reachGoal и fireAnalyticsEvent', () => {
      adapter.trackEvent('CUSTOM_EVENT', { custom: 'payload' })

      expect(mockMetrikaService.reachGoal).toHaveBeenCalledWith('CUSTOM_EVENT', {
        custom: 'payload',
      })
      vi.advanceTimersByTime(2000)
      expect(mockAnalyticsService.postAnalyticsEvent).toHaveBeenCalled()
    })
  })

  describe('Event Queue', () => {
    it('должен обрабатывать очередь событий после debounce', async () => {
      adapter.trackEvent('EVENT_1')
      adapter.trackEvent('EVENT_2')

      expect(mockAnalyticsService.postAnalyticsEvent).not.toHaveBeenCalled()

      vi.advanceTimersByTime(2000)

      // Даем промису внутри processEventQueue завершиться
      await new Promise(process.nextTick)

      expect(mockAnalyticsService.postAnalyticsEvent).toHaveBeenCalledTimes(2)
    })

    it('должен обрабатывать ошибку при отправке событий', async () => {
      console.error = vi.fn()
      const error = new Error('Analytics API Error')
      vi.mocked(mockAnalyticsService.postAnalyticsEvent).mockRejectedValue(error)

      adapter.trackEvent('EVENT_1')
      vi.advanceTimersByTime(2000)
      await new Promise(process.nextTick)

      expect(console.error).toHaveBeenCalledWith('Failed to send analytics events:', error)
    })
  })
})

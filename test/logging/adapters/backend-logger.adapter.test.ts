/**
 * Тесты для BackendLoggerAdapter
 * @module test/logging/adapters/backend-logger.adapter.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BackendLoggerAdapter } from '../../../src/logging/adapters/backend-logger.adapter'
import { LogEvent, LogLevel, LogCategory, LogSource } from '../../../src/logging/models'
import {
  AnalyticsApiService,
  AnalyticsEventPayload,
} from '../../../src/logging/models/analytics.models'
import { LogContext } from '../../../src/logging/models/log-context.model'

const createMockApiClient = (): AnalyticsApiService => ({
  postAnalyticsEvent: vi.fn(() => Promise.resolve()),
})

describe('BackendLoggerAdapter', () => {
  let adapter: BackendLoggerAdapter
  let mockApiClient: AnalyticsApiService

  beforeEach(() => {
    mockApiClient = createMockApiClient()
    adapter = new BackendLoggerAdapter(mockApiClient)
    console.error = vi.fn()
  })

  const createTestEvent = (level: LogLevel = LogLevel.INFO): LogEvent => ({
    level,
    category: LogCategory.SYSTEM,
    action: 'test_action',
    source: LogSource.BACKEND,
    timestamp: 1234567890,
    success: true,
    details: { custom: 'data' },
  })

  const createTestContext = (): LogContext => ({
    userId: 'user-123',
    sessionId: 'session-abc',
    fingerprint: 'fingerprint-xyz',
    ipAddress: '127.0.0.1',
    using2FA: true,
  })

  describe('log', () => {
    it('должен отправлять событие в API', () => {
      const event = createTestEvent()
      const context = createTestContext()

      adapter.log(event, context)

      const expectedPayload: AnalyticsEventPayload = {
        event: 'system.test_action',
        value: { custom: 'data', success: true, level: 'info' },
        fire_at: event.timestamp as number,
        source: 'user',
        extra: JSON.stringify({
          userId: 'user-123',
          sessionId: 'session-abc',
          fingerprint: 'fingerprint-xyz',
          ipAddress: '127.0.0.1',
          geoLocation: undefined,
          deviceInfo: undefined,
          interfaceType: undefined,
          using2FA: true,
        }),
      }

      expect(mockApiClient.postAnalyticsEvent).toHaveBeenCalledWith([expectedPayload])
    })

    it('должен обрабатывать ошибки API', () => {
      const error = new Error('API Error')
      vi.mocked(mockApiClient.postAnalyticsEvent).mockRejectedValue(error)

      adapter.log(createTestEvent(), createTestContext())

      // Ожидаем, что ошибка будет залогирована в консоль
      // Используем setTimeout, чтобы дождаться выполнения асинхронного catch
      return new Promise<void>(resolve => {
        setTimeout(() => {
          expect(console.error).toHaveBeenCalledWith('Failed to send log event to backend:', error)
          resolve()
        }, 0)
      })
    })
  })

  describe('batchLog', () => {
    it('должен отправлять несколько событий в API', () => {
      const events = [createTestEvent(), createTestEvent()]
      const context = createTestContext()

      adapter.batchLog(events, context)

      expect(mockApiClient.postAnalyticsEvent).toHaveBeenCalledWith(expect.any(Array))
      const sentPayloads = vi.mocked(mockApiClient.postAnalyticsEvent).mock.calls[0][0]
      expect(Array.isArray(sentPayloads)).toBe(true)
      expect((sentPayloads as AnalyticsEventPayload[]).length).toBe(2)
      expect(sentPayloads[0].event).toBe('system.test_action')
    })
  })

  describe('supports', () => {
    it('должен поддерживать все уровни, кроме DEBUG', () => {
      expect(adapter.supports(createTestEvent(LogLevel.INFO))).toBe(true)
      expect(adapter.supports(createTestEvent(LogLevel.IMPORTANT))).toBe(true)
      expect(adapter.supports(createTestEvent(LogLevel.CRITICAL))).toBe(true)
    })

    it('не должен поддерживать уровень DEBUG', () => {
      expect(adapter.supports(createTestEvent(LogLevel.DEBUG))).toBe(false)
    })
  })
})

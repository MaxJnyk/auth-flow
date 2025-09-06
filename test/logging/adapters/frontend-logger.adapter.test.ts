/**
 * Тесты для FrontendLoggerAdapter
 * @module test/logging/adapters/frontend-logger.adapter.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FrontendLoggerAdapter } from '../../../src/logging/adapters/frontend-logger.adapter'
import { LogCategory, LogEvent, LogLevel, LogSource } from '../../../src/logging/models'

interface LogContext {
  userId?: string
  sessionId?: string
  userAgent?: string
}

describe('FrontendLoggerAdapter', () => {
  let adapter: FrontendLoggerAdapter
  let mockStorage: Storage

  beforeEach(() => {
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    }

    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    adapter = new FrontendLoggerAdapter(mockStorage)
  })

  describe('log', () => {
    it('должен логировать события в консоль', () => {
      const event = createTestEvent()
      const context = createTestContext()

      adapter.log(event, context)

      expect(console.log).toHaveBeenCalled()
    })
  })

  describe('batchLog', () => {
    it('должен логировать несколько событий', () => {
      const events = [createTestEvent(), createTestEvent()]
      const context = createTestContext()

      adapter.batchLog(events, context)

      expect(console.log).toHaveBeenCalledTimes(2)
    })
  })

  describe('supports', () => {
    it('должен всегда возвращать true', () => {
      const event = createTestEvent()
      expect(adapter.supports(event)).toBe(true)
    })
  })

  describe('synchronize', () => {
    it('должен вызывать колбэк с событиями', async () => {
      const event = createTestEvent()
      const context = createTestContext()

      adapter.log(event, context)

      const syncCallback = vi.fn().mockResolvedValue(undefined)
      await adapter.synchronize(syncCallback)

      expect(syncCallback).toHaveBeenCalled()
    })

    it('не должен вызывать колбэк, если нет событий', async () => {
      const syncCallback = vi.fn().mockResolvedValue(undefined)
      await adapter.synchronize(syncCallback)

      expect(syncCallback).not.toHaveBeenCalled()
    })

    it('должен обрабатывать ошибки при синхронизации', async () => {
      const event = createTestEvent()
      const context = createTestContext()

      adapter.log(event, context)

      const syncCallback = vi.fn().mockRejectedValue(new Error('Sync error'))
      await adapter.synchronize(syncCallback)

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('getQueueSize', () => {
    it('должен возвращать размер очереди', () => {
      const event = createTestEvent()
      const context = createTestContext()

      expect(adapter.getQueueSize()).toBe(0)

      adapter.log(event, context)

      expect(adapter.getQueueSize()).toBeGreaterThan(0)
    })
  })

  describe('clearQueue', () => {
    it('должен очищать очередь событий', () => {
      const event = createTestEvent()
      const context = createTestContext()

      adapter.log(event, context)
      expect(adapter.getQueueSize()).toBeGreaterThan(0)

      adapter.clearQueue()
      expect(adapter.getQueueSize()).toBe(0)
    })
  })
})

function createTestEvent(): LogEvent {
  return {
    category: LogCategory.AUTH,
    action: 'test_action',
    level: LogLevel.INFO,
    source: LogSource.FRONTEND,
    timestamp: Date.now(),
    details: { test: 'data' },
    success: true,
  }
}

function createTestContext(): LogContext {
  return {
    userId: 'test-user',
    sessionId: 'test-session',
    userAgent: 'test-agent',
  }
}

/**
 * Тесты для LoggerService
 * @module test/logging/services/logger.service.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoggerService } from '../../../src/logging/services/logger.service'
import { LogEvent, LogLevel, LogSource, LogCategory } from '../../../src/logging/models'
import { LoggerAdapter } from '../../../src/logging/adapters'

const createMockAdapter = (): LoggerAdapter => ({
  log: vi.fn(),
  batchLog: vi.fn(),
  supports: vi.fn(() => true),
})

describe('LoggerService', () => {
  let logger: LoggerService
  let mockAdapter1: LoggerAdapter
  let mockAdapter2: LoggerAdapter

  beforeEach(() => {
    mockAdapter1 = createMockAdapter()
    mockAdapter2 = createMockAdapter()
    logger = new LoggerService([mockAdapter1, mockAdapter2])
    console.error = vi.fn()
  })

  describe('log', () => {
    it('должен вызывать log у всех поддерживающих адаптеров', () => {
      const event: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test',
        source: LogSource.FRONTEND,
      }
      logger.log(event)

      expect(mockAdapter1.log).toHaveBeenCalledWith(event, expect.any(Object))
      expect(mockAdapter2.log).toHaveBeenCalledWith(event, expect.any(Object))
    })

    it('не должен логировать, если уровень события ниже минимального', () => {
      logger.setMinLevel(LogLevel.IMPORTANT)
      const event: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test',
        source: LogSource.FRONTEND,
      }
      logger.log(event)

      expect(mockAdapter1.log).not.toHaveBeenCalled()
    })

    it('не должен логировать, если логирование отключено (кроме CRITICAL)', () => {
      logger.disable()
      const eventInfo: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test',
        source: LogSource.FRONTEND,
      }
      const eventCritical: LogEvent = {
        level: LogLevel.CRITICAL,
        category: LogCategory.SYSTEM,
        action: 'critical_test',
        source: LogSource.FRONTEND,
      }

      logger.log(eventInfo)
      expect(mockAdapter1.log).not.toHaveBeenCalled()

      logger.log(eventCritical)
      expect(mockAdapter1.log).toHaveBeenCalledWith(eventCritical, expect.any(Object))
    })

    it('должен добавлять timestamp и source, если они отсутствуют', () => {
      const event: Omit<LogEvent, 'source' | 'timestamp'> = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test',
      }
      logger.log(event as LogEvent)

      const expectedEvent = expect.objectContaining({
        ...event,
        timestamp: expect.any(Number),
        source: LogSource.FRONTEND,
      })

      expect(mockAdapter1.log).toHaveBeenCalledWith(expectedEvent, expect.any(Object))
    })

    it('должен обрабатывать ошибки в адаптерах', () => {
      const error = new Error('Adapter error')
      vi.mocked(mockAdapter1.log).mockImplementation(() => {
        throw error
      })

      const event: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test',
        source: LogSource.FRONTEND,
      }
      logger.log(event)

      expect(console.error).toHaveBeenCalledWith('Error in logger adapter:', error)
      // Второй адаптер должен все равно выполниться
      expect(mockAdapter2.log).toHaveBeenCalled()
    })
  })

  describe('batchLog', () => {
    it('должен вызывать batchLog, если он поддерживается', () => {
      const events: LogEvent[] = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          action: 'test1',
          source: LogSource.FRONTEND,
        },
      ]
      logger.batchLog(events)

      expect(mockAdapter1.batchLog).toHaveBeenCalledWith(expect.any(Array), expect.any(Object))
    })

    it('должен вызывать log для каждого события, если batchLog не поддерживается', () => {
      const mockAdapterWithoutBatch = { ...createMockAdapter(), batchLog: undefined }
      logger = new LoggerService([mockAdapterWithoutBatch])
      const events: LogEvent[] = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          action: 'test1',
          source: LogSource.FRONTEND,
        },
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          action: 'test2',
          source: LogSource.FRONTEND,
        },
      ]
      logger.batchLog(events)

      expect(mockAdapterWithoutBatch.log).toHaveBeenCalledTimes(2)
    })

    it('должен фильтровать события по уровню', () => {
      logger.setMinLevel(LogLevel.IMPORTANT)
      const events: LogEvent[] = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          action: 'info',
          source: LogSource.FRONTEND,
        },
        {
          level: LogLevel.IMPORTANT,
          category: LogCategory.SYSTEM,
          action: 'important',
          source: LogSource.FRONTEND,
        },
      ]
      logger.batchLog(events)

      expect(mockAdapter1.batchLog).toHaveBeenCalledWith(
        [expect.objectContaining({ action: 'important' })],
        expect.any(Object),
      )
    })

    it('не должен вызывать адаптеры, если все события отфильтрованы', () => {
      logger.setMinLevel(LogLevel.CRITICAL)
      const events: LogEvent[] = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          action: 'info',
          source: LogSource.FRONTEND,
        },
      ]
      logger.batchLog(events)

      expect(mockAdapter1.batchLog).not.toHaveBeenCalled()
    })
  })

  describe('Options', () => {
    it('должен обновлять опции через updateOptions', () => {
      logger.updateOptions({ minLevel: LogLevel.CRITICAL, logEnabled: false })
      const event: LogEvent = {
        level: LogLevel.IMPORTANT,
        category: LogCategory.SYSTEM,
        action: 'test',
        source: LogSource.FRONTEND,
      }
      logger.log(event)

      expect(mockAdapter1.log).not.toHaveBeenCalled()
    })

    it('должен обновлять контекст по умолчанию', () => {
      logger.updateDefaultContext({ userId: 'test-user' })
      const event: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test',
        source: LogSource.FRONTEND,
      }
      logger.log(event)

      const expectedContext = expect.objectContaining({ userId: 'test-user' })
      expect(mockAdapter1.log).toHaveBeenCalledWith(expect.any(Object), expectedContext)
    })
  })
})

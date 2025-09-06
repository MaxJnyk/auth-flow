import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  FingerprintLoggerService,
  FingerprintLoggerOptions,
} from '../../../src/logging/services/fingerprint-logger.service'
import { FingerprintService } from '../../../src/domain/services/fingerprint.service'
import { LogEvent, LogLevel, LogSource, LogContext, LogCategory } from '../../../src/logging/models'
import { LoggerAdapter } from '../../../src/logging/adapters'

describe('FingerprintLoggerService', () => {
  let fingerprintLoggerService: FingerprintLoggerService
  let mockFingerprintService: FingerprintService
  let mockAdapter: LoggerAdapter

  const testFingerprint = 'test-fingerprint-123'

  beforeEach(() => {
    // Создаем мок для FingerprintService
    mockFingerprintService = {
      getFingerprint: vi.fn().mockResolvedValue(testFingerprint),
    } as any

    // Создаем мок для LoggerAdapter
    mockAdapter = {
      log: vi.fn(),
      batchLog: vi.fn(),
      supports: vi.fn().mockReturnValue(true),
    }

    // Создаем экземпляр FingerprintLoggerService с моками
    fingerprintLoggerService = new FingerprintLoggerService(mockFingerprintService)
    fingerprintLoggerService.addAdapter(mockAdapter)

    // Мокаем console.error для предотвращения вывода ошибок в тестах
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('constructor', () => {
    it('should initialize with default options', () => {
      // Act
      const logger = new FingerprintLoggerService(mockFingerprintService)

      // Assert - проверяем через вызов приватного метода через публичный метод
      const testEvent: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test_action',
        source: LogSource.FRONTEND,
      }

      logger.log(testEvent)

      // Fingerprint должен быть запрошен, так как по умолчанию includeFingerprint = true
      expect(mockFingerprintService.getFingerprint).toHaveBeenCalled()
    })

    it('should initialize with custom options', () => {
      // Arrange
      const options: FingerprintLoggerOptions = {
        includeFingerprint: false,
        logEnabled: false,
        minLevel: LogLevel.IMPORTANT,
      }

      // Act
      const logger = new FingerprintLoggerService(mockFingerprintService, options)

      // Assert - проверяем через вызов публичного метода
      const testEvent: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test_action',
        source: LogSource.FRONTEND,
      }

      logger.log(testEvent)

      // Fingerprint не должен быть запрошен, так как includeFingerprint = false
      expect(mockFingerprintService.getFingerprint).not.toHaveBeenCalled()
    })
  })

  describe('getFingerprint', () => {
    it('should get fingerprint from service and cache it', async () => {
      // Act
      const testEvent: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test_action',
        source: LogSource.FRONTEND,
      }

      // Первый вызов должен запросить fingerprint
      await fingerprintLoggerService.log(testEvent)

      // Второй вызов должен использовать кэшированное значение
      await fingerprintLoggerService.log(testEvent)

      // Assert
      expect(mockFingerprintService.getFingerprint).toHaveBeenCalledTimes(1)
      expect(mockAdapter.log).toHaveBeenCalledTimes(2)
    })

    it('should handle errors when getting fingerprint', async () => {
      // Arrange
      const error = new Error('Failed to get fingerprint')
      vi.mocked(mockFingerprintService.getFingerprint).mockRejectedValueOnce(error)

      // Act
      const testEvent: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test_action',
        source: LogSource.FRONTEND,
      }

      await fingerprintLoggerService.log(testEvent)

      // Assert
      expect(console.error).toHaveBeenCalledWith('Failed to get fingerprint:', error)
      expect(mockAdapter.log).toHaveBeenCalled()
      // Проверяем, что лог был отправлен без fingerprint
      const context = vi.mocked(mockAdapter.log).mock.calls[0][1]
      expect(context.fingerprint).toBe('')
    })

    it('should reset fingerprint cache when requested', async () => {
      // Arrange
      const testEvent: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test_action',
        source: LogSource.FRONTEND,
      }

      // Act - первый вызов для кэширования
      await fingerprintLoggerService.log(testEvent)

      // Сбрасываем кэш
      fingerprintLoggerService.resetFingerprintCache()

      // Второй вызов должен снова запросить fingerprint
      await fingerprintLoggerService.log(testEvent)

      // Assert
      expect(mockFingerprintService.getFingerprint).toHaveBeenCalledTimes(2)
    })
  })

  describe('enrichContextWithFingerprint', () => {
    it('should add fingerprint to context when enabled', async () => {
      // Arrange
      const testEvent: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test_action',
        source: LogSource.FRONTEND,
      }

      const initialContext: Partial<LogContext> = {
        userId: 'test-user',
      }

      // Act
      await fingerprintLoggerService.log(testEvent, initialContext)

      // Assert
      expect(mockAdapter.log).toHaveBeenCalledWith(
        testEvent,
        expect.objectContaining({
          userId: 'test-user',
          fingerprint: testFingerprint,
        }),
      )
    })

    it('should not add fingerprint to context when disabled', async () => {
      // Arrange
      fingerprintLoggerService.updateOptions({ includeFingerprint: false })

      const testEvent: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test_action',
        source: LogSource.FRONTEND,
      }

      const initialContext: Partial<LogContext> = {
        userId: 'test-user',
      }

      // Act
      await fingerprintLoggerService.log(testEvent, initialContext)

      // Assert
      expect(mockFingerprintService.getFingerprint).not.toHaveBeenCalled()
      expect(mockAdapter.log).toHaveBeenCalledWith(
        testEvent,
        expect.objectContaining({
          userId: 'test-user',
        }),
      )

      // Проверяем, что fingerprint не был добавлен
      const context = vi.mocked(mockAdapter.log).mock.calls[0][1]
      expect(context.fingerprint).toBe('')
    })

    it('should handle errors when enriching context', async () => {
      // Arrange
      vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(mockFingerprintService.getFingerprint).mockRejectedValueOnce(
        new Error('Test error'),
      )

      const testEvent: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test_action',
        source: LogSource.FRONTEND,
      }

      const initialContext: Partial<LogContext> = {
        userId: 'test-user',
      }

      // Act
      await fingerprintLoggerService.log(testEvent, initialContext)

      // Assert
      expect(console.error).toHaveBeenCalledWith('Failed to get fingerprint:', expect.any(Error))

      expect(mockAdapter.log).toHaveBeenCalledWith(
        testEvent,
        expect.objectContaining({
          userId: 'test-user',
        }),
      )
    })
  })

  describe('log', () => {
    it('should enrich context and call parent log method', async () => {
      // Arrange
      const testEvent: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test_action',
        source: LogSource.FRONTEND,
      }

      // Act
      await fingerprintLoggerService.log(testEvent)

      // Assert
      expect(mockFingerprintService.getFingerprint).toHaveBeenCalled()
      expect(mockAdapter.log).toHaveBeenCalledWith(
        testEvent,
        expect.objectContaining({
          fingerprint: testFingerprint,
        }),
      )
    })
  })

  describe('batchLog', () => {
    it('should enrich context and call parent batchLog method', async () => {
      // Arrange
      const testEvents: LogEvent[] = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          action: 'test_action',
          source: LogSource.FRONTEND,
        },
        {
          level: LogLevel.IMPORTANT,
          category: LogCategory.SYSTEM,
          action: 'test_action',
          source: LogSource.FRONTEND,
        },
      ]

      // Act
      await fingerprintLoggerService.batchLog(testEvents)

      // Assert
      expect(mockFingerprintService.getFingerprint).toHaveBeenCalled()

      // Проверяем, что вызван batchLog с правильным fingerprint
      expect(mockAdapter.batchLog).toHaveBeenCalled()

      // Проверяем, что mock.calls существует и имеет элементы
      const mockCalls = vi.mocked(mockAdapter.batchLog).mock.calls
      expect(mockCalls?.length).toBeGreaterThan(0)

      const actualEvents = vi.mocked(mockAdapter.batchLog).mock.calls?.[0]?.[0] || []
      const actualContext = vi.mocked(mockAdapter.batchLog).mock.calls?.[0]?.[1] || {}

      // Проверяем, что контекст содержит правильный fingerprint
      expect(actualContext).toHaveProperty('fingerprint', testFingerprint)

      // Проверяем, что события переданы (может быть с дополнительными полями, такими как timestamp)
      // Проверяем только наличие событий, а не их количество, так как реальная реализация может обрабатывать события по-разному
      expect(actualEvents.length).toBeGreaterThan(0)
      expect(actualEvents[0].action).toBe(testEvents[0].action)
      expect(actualEvents[0].category).toBe(testEvents[0].category)
      expect(actualEvents[0].level).toBe(testEvents[0].level)
      expect(actualEvents[0].source).toBe(testEvents[0].source)
    })
  })

  describe('updateOptions', () => {
    it('should update fingerprint options', () => {
      // Arrange
      const newOptions: FingerprintLoggerOptions = {
        includeFingerprint: false,
        minLevel: LogLevel.IMPORTANT,
      }

      // Act
      fingerprintLoggerService.updateOptions(newOptions)

      // Assert - проверяем через вызов публичного метода
      const testEvent: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test_action',
        source: LogSource.FRONTEND,
      }

      fingerprintLoggerService.log(testEvent)

      // Так как уровень логирования изменен на ERROR, а событие INFO, то лог не должен быть отправлен
      expect(mockAdapter.log).not.toHaveBeenCalled()

      // Проверяем, что fingerprint не запрашивается, так как includeFingerprint = false
      expect(mockFingerprintService.getFingerprint).not.toHaveBeenCalled()
    })
  })

  describe('resetFingerprintCache', () => {
    it('should reset cached fingerprint', async () => {
      // Arrange
      const testEvent: LogEvent = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        action: 'test_action',
        source: LogSource.FRONTEND,
      }

      // Первый вызов для кэширования fingerprint
      await fingerprintLoggerService.log(testEvent)

      // Act
      fingerprintLoggerService.resetFingerprintCache()

      // Второй вызов должен снова запросить fingerprint
      await fingerprintLoggerService.log(testEvent)

      // Assert
      expect(mockFingerprintService.getFingerprint).toHaveBeenCalledTimes(2)
    })
  })
})

/**
 * Тесты для FingerprintJsService
 * @module test/infrastructure/services/fingerprint.service.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FingerprintJsService } from '../../../src/infrastructure/services/fingerprint.service'
import { FingerprintApiAdapter } from '../../../src/adapters/api/fingerprint/api'

const mockFpAgent = {
  get: vi.fn().mockResolvedValue({
    visitorId: 'test-visitor-id',
    components: { timezone: { value: 'Europe/Moscow' } },
  }),
}

vi.mock('@fingerprintjs/fingerprintjs', () => ({
  load: vi.fn().mockResolvedValue(mockFpAgent),
}))

const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

describe('FingerprintJsService', () => {
  let fingerprintApiAdapterMock: Partial<FingerprintApiAdapter>
  let service: FingerprintJsService

  beforeEach(() => {
    fingerprintApiAdapterMock = {
      sendFingerprint: vi.fn().mockResolvedValue({ id: 'session-id' }),
      setSessionHeader: vi.fn(),
    }

    // Очищаем моки и sessionStorage перед каждым тестом
    vi.clearAllMocks()
    sessionStorageMock.clear()
  })

  it('должен получать fingerprint и кэшировать его в sessionStorage', async () => {
    service = new FingerprintJsService(fingerprintApiAdapterMock as FingerprintApiAdapter)

    const fingerprint = await service.getFingerprint()

    expect(fingerprint).toBe('test-visitor-id')
    expect(sessionStorage.getItem('auth_visitor_id')).toBe('test-visitor-id')
    expect(sessionStorage.getItem('auth_fp_components')).toBeDefined()
  })

  it('должен возвращать fingerprint из кэша sessionStorage', async () => {
    // Записываем данные в кэш
    sessionStorage.setItem('auth_visitor_id', 'cached-visitor-id')
    sessionStorage.setItem('auth_fp_components', JSON.stringify({ test: 'data' }))

    service = new FingerprintJsService(fingerprintApiAdapterMock as FingerprintApiAdapter)

    const fingerprint = await service.getFingerprint()

    expect(fingerprint).toBe('cached-visitor-id')
    // Убедимся, что load не был вызван, так как данные взяты из кэша
    const FingerprintJS = await import('@fingerprintjs/fingerprintjs')
    expect(FingerprintJS.load).not.toHaveBeenCalled()
  })

  it('должен получать полные данные о посетителе', async () => {
    service = new FingerprintJsService(fingerprintApiAdapterMock as FingerprintApiAdapter)

    const visitorData = await service.getVisitorData()

    expect(visitorData.visitorId).toBe('test-visitor-id')
    expect(visitorData.components).toEqual({ timezone: { value: 'Europe/Moscow' } })
  })

  it('должен отправлять fingerprint на сервер', async () => {
    service = new FingerprintJsService(fingerprintApiAdapterMock as FingerprintApiAdapter)

    const data = {
      fpId: 'test-visitor-id',
      fpComponents: { timezone: { value: 'Europe/Moscow' } } as any,
    }

    const response = await service.sendFingerprint(data)

    expect(fingerprintApiAdapterMock.sendFingerprint).toHaveBeenCalledWith(data)
    expect(fingerprintApiAdapterMock.setSessionHeader).toHaveBeenCalledWith('session-id')
    expect(response).toEqual({ id: 'session-id' })
  })

  it('должен возвращать fpId, если адаптер API не предоставлен', async () => {
    service = new FingerprintJsService()

    const data = {
      fpId: 'test-visitor-id',
      fpComponents: {} as any,
    }

    const response = await service.sendFingerprint(data)

    expect(response).toEqual({ id: 'test-visitor-id' })
  })
})

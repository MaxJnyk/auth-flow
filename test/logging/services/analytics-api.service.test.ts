/**
 * Тесты для AnalyticsApiService
 * @module test/logging/services/analytics-api.service.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalyticsApiService } from '../../../src/logging/services/analytics-api.service'
import { AnalyticsEventPayload } from '../../../src/logging/models/analytics.models'

describe('AnalyticsApiService', () => {
  let service: AnalyticsApiService
  const apiUrl = 'https://api.test.com'
  const mockFetch = vi.fn()

  beforeEach(() => {
    global.fetch = mockFetch
    service = new AnalyticsApiService(apiUrl, mockFetch)
    console.error = vi.fn()
    vi.clearAllMocks()
  })

  const createPayload = (event: string): AnalyticsEventPayload => ({
    event,
    value: { data: 'test' },
    fire_at: Date.now(),
    source: 'user',
  })

  it('должен отправлять одно событие', async () => {
    const payload = createPayload('single_event')
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) })

    await service.postAnalyticsEvent(payload)

    expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([payload]),
    })
  })

  it('должен отправлять массив событий', async () => {
    const payloads = [createPayload('event1'), createPayload('event2')]
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) })

    await service.postAnalyticsEvent(payloads)

    expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloads),
    })
  })

  it('должен возвращать json при успешном ответе', async () => {
    const payload = createPayload('success_event')
    const mockResponse = { success: true, processed: 1 }
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) })

    const result = await service.postAnalyticsEvent(payload)

    expect(result).toEqual(mockResponse)
  })

  it('должен выбрасывать ошибку при неуспешном ответе API', async () => {
    const payload = createPayload('fail_event')
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' })

    await expect(service.postAnalyticsEvent(payload)).rejects.toThrow(
      'Analytics API error: 500 Server Error',
    )
  })

  it('должен обрабатывать сетевые ошибки', async () => {
    const payload = createPayload('network_error')
    const networkError = new Error('Network failed')
    mockFetch.mockRejectedValue(networkError)

    await expect(service.postAnalyticsEvent(payload)).rejects.toThrow(networkError)
    expect(console.error).toHaveBeenCalledWith('Failed to post analytics event:', networkError)
  })
})

import { AnalyticsEventPayload } from '../models/analytics.models'

export class AnalyticsApiService {
  constructor(
    private apiUrl: string,
    private fetchFn: typeof fetch = typeof window !== 'undefined'
      ? window.fetch.bind(window)
      : fetch,
  ) {}

  async postAnalyticsEvent(payload: AnalyticsEventPayload[] | AnalyticsEventPayload): Promise<any> {
    try {
      const response = await this.fetchFn(`${this.apiUrl}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Array.isArray(payload) ? payload : [payload]),
      })

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to post analytics event:', error)
      throw error
    }
  }
}

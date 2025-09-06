export interface YandexMetrikaService {
  reachGoal(goal: string, params?: Record<string, any>): void
}

export interface AnalyticsApiService {
  postAnalyticsEvent(payload: AnalyticsEventPayload[] | AnalyticsEventPayload): Promise<any>
}

export interface AnalyticsEventPayload {
  source: string
  value?: any
  event: string
  goal?: string
  fire_at: number
  destination?: string
  extra?: string
}

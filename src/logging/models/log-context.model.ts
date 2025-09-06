export interface LogContext {
  userId?: string
  sessionId?: string
  fingerprint?: string
  ipAddress?: string
  geoLocation?: {
    country?: string
    city?: string
  }
  deviceInfo?: {
    type: 'mobile' | 'tablet' | 'desktop'
    os: string
    browser: string
  }
  interfaceType?: 'web' | 'mobile-app'
  using2FA?: boolean
}

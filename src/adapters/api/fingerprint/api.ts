import { HttpClient } from '../../../infrastructure/http/http-client.interface'
import { SendFingerprintPayload, SendFingerprintResponse } from './models'

export class FingerprintApiAdapter {
  private readonly basePath: string
  private readonly sendPath: string

  constructor(
    private readonly httpClient: HttpClient,
    basePath: string = '/api/fingerprint',
    sendPath: string = '/',
  ) {
    this.basePath = basePath
    this.sendPath = sendPath
  }

  async sendFingerprint(payload: SendFingerprintPayload): Promise<SendFingerprintResponse> {
    const fullPath = `${this.basePath}${this.sendPath}`
    return this.httpClient.post<SendFingerprintResponse>(fullPath, payload)
  }

  setSessionHeader(sessionId: string | null): void {
    if (sessionId === null) {
      this.httpClient.deleteHeader('X-Session')
    } else {
      this.httpClient.setHeader('X-Session', sessionId)
    }
  }
}

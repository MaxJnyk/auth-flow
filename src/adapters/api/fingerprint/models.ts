import { BuiltinComponents } from '@fingerprintjs/fingerprintjs'

export interface SendFingerprintPayload {
  fpId: string
  fpComponents: BuiltinComponents
}

export interface SendFingerprintResponse {
  id: string
}

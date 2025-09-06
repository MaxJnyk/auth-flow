import { AuthResult, TwoFactorMethod } from '../models/auth.models'
import { TwoFactorSetupData } from '../models/two-factor-setup.model'

export interface TwoFactorService {
  verifyCode(code: string, method: TwoFactorMethod): Promise<AuthResult>
  sendCode(method: TwoFactorMethod): Promise<void>
  getAvailableMethods(): Promise<TwoFactorMethod[]>
  setupMethod(method: TwoFactorMethod): Promise<{ setupData: TwoFactorSetupData }>
  confirmMethodSetup(method: TwoFactorMethod, code: string): Promise<void>
  disableMethod(method: TwoFactorMethod): Promise<void>
}

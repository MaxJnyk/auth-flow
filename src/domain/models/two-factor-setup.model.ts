import { TwoFactorMethodType } from './auth.models'

export interface BaseTwoFactorSetupData {
  methodType: TwoFactorMethodType
  [key: string]: unknown
}

export interface EmailTwoFactorSetupData extends BaseTwoFactorSetupData {
  methodType: TwoFactorMethodType.EMAIL
  email?: string
  expiresAt?: number
}

export interface SmsTwoFactorSetupData extends BaseTwoFactorSetupData {
  methodType: TwoFactorMethodType.SMS
  phoneNumber?: string
  maskedPhone?: string
  expiresAt?: number
}

export interface TotpTwoFactorSetupData extends BaseTwoFactorSetupData {
  methodType: TwoFactorMethodType.TOTP
  secretKey?: string
  qrCodeUrl?: string
  manualEntryCode?: string
}

export interface TelegramTwoFactorSetupData extends BaseTwoFactorSetupData {
  methodType: TwoFactorMethodType.TELEGRAM
  message?: string
  widgetId?: string
}

export type TwoFactorSetupData =
  | EmailTwoFactorSetupData
  | SmsTwoFactorSetupData
  | TotpTwoFactorSetupData
  | TelegramTwoFactorSetupData
  | BaseTwoFactorSetupData

export interface TwoFactorSetupResponse {
  setupData: TwoFactorSetupData
}

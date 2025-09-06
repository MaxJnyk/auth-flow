// Явный экспорт из auth.models
// Экспорт типов и интерфейсов
export type {
  AuthCredentials,
  UserRegistrationData,
  AuthTokens,
  AuthResult,
  EmailSignUpData,
  TwoFactorMethod,
  TgSignInOptions,
  UserProfile,
  TelegramSignInResult,
  TelegramConfirmOptions,
} from './auth.models'

// Экспорт enum
export { TwoFactorMethodType } from './auth.models'

// Явный экспорт из user.models
export type {
  ProfileUpdateData,
  PasswordChangeData,
  EmailChangeData,
  UserSession,
} from './user.models'

// Явный экспорт схем валидации
export {
  // Схемы
  emailSchema,
  passwordSchema,
  usernameSchema,
  phoneSchema,
  telegramUsernameSchema,
  twoFactorCodeSchema,
  authCredentialsSchema,
  userRegistrationSchema,
  authTokensSchema,
  userProfileSchema,
} from './validation.schemas'

// Явный экспорт типов из Zod-схем
export type {
  ZodEmail,
  ZodPassword,
  ZodUsername,
  ZodPhone,
  ZodTelegramUsername,
  ZodTwoFactorCode,
  ZodAuthCredentials,
  ZodUserRegistration,
  ZodAuthTokens,
  ZodUserProfile,
} from './validation.schemas'

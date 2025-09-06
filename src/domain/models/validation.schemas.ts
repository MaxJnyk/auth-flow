import { z } from 'zod'
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidUsername,
  isValidTelegramUsername,
  formatPhoneNumber,
  formatTelegramUsername,
} from '../../utils/validation'

export const emailSchema = z.string().min(1, { message: 'Email обязателен' }).refine(isValidEmail, {
  message: 'Введите корректный email адрес (только латинские символы)',
})
export const passwordSchema = z
  .string()
  .min(8, { message: 'Пароль должен содержать не менее 8 символов' })
  .refine(isValidPassword, {
    message: 'Пароль должен содержать минимум 1 цифру и 1 заглавную букву',
  })
export const usernameSchema = z
  .string()
  .min(3, { message: 'Никнейм должен содержать не менее 3 символов' })
  .max(30, { message: 'Никнейм должен содержать не более 30 символов' })
  .refine(isValidUsername, {
    message: 'Никнейм может содержать только латинские буквы, цифры и подчеркивания',
  })
export const phoneSchema = z.string().transform(formatPhoneNumber).refine(isValidPhone, {
  message: 'Введите корректный номер телефона в формате +7XXXXXXXXXX',
})
export const telegramUsernameSchema = z
  .string()
  .transform(formatTelegramUsername)
  .refine(isValidTelegramUsername, {
    message:
      'Введите корректный никнейм Telegram (5-32 символа, только латинские буквы, цифры и подчеркивания)',
  })
export const twoFactorCodeSchema = z.string().min(1, { message: 'Введите код подтверждения' })

export const authCredentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.string().optional(),
})

export const userProfileSchema = z.object({
  id: z.string(),
  email: emailSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  isEmailVerified: z.boolean().optional(),
  mfaEnabled: z.boolean().optional(),
  mfaMethods: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(['email', 'sms', 'telegram', 'totp']),
        isAvailable: z.boolean(),
        isConfigured: z.boolean(),
        maskedIdentifier: z.string().optional(),
        userId: z.string().optional(),
      }),
    )
    .optional(),
})

// Типы, выведенные из схем Zod
export type ZodEmail = z.infer<typeof emailSchema>
export type ZodPassword = z.infer<typeof passwordSchema>
export type ZodUsername = z.infer<typeof usernameSchema>
export type ZodPhone = z.infer<typeof phoneSchema>
export type ZodTelegramUsername = z.infer<typeof telegramUsernameSchema>
export type ZodTwoFactorCode = z.infer<typeof twoFactorCodeSchema>
export type ZodAuthCredentials = z.infer<typeof authCredentialsSchema>
export type ZodUserRegistration = z.infer<typeof userRegistrationSchema>
export type ZodAuthTokens = z.infer<typeof authTokensSchema>
export type ZodUserProfile = z.infer<typeof userProfileSchema>

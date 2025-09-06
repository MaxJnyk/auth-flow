import { LogCategory } from '../models/log-category.enum'
import { AuthEvent } from '../models/auth-events.enum'
import { MetrikaEvent } from './metrika-events'

export const metrikaEventMap: Record<string, MetrikaEvent> = {
  // События входа
  [`${LogCategory.AUTH}.${AuthEvent.LOGIN_ATTEMPT}`]: MetrikaEvent.LOGIN_ATTEMPT,
  [`${LogCategory.AUTH}.${AuthEvent.LOGIN_SUCCESS}`]: MetrikaEvent.LOGIN_SUCCESS,
  [`${LogCategory.AUTH}.${AuthEvent.LOGIN_FAILURE}`]: MetrikaEvent.LOGIN_FAILURE,
  [`${LogCategory.AUTH}.${AuthEvent.LOGOUT}`]: MetrikaEvent.LOGOUT,

  // События регистрации
  [`${LogCategory.AUTH}.${AuthEvent.REGISTRATION_ATTEMPT}`]: MetrikaEvent.REGISTRATION_ATTEMPT,
  [`${LogCategory.AUTH}.${AuthEvent.REGISTRATION_SUCCESS}`]: MetrikaEvent.REGISTRATION_SUCCESS,
  [`${LogCategory.AUTH}.${AuthEvent.REGISTRATION_FAILURE}`]: MetrikaEvent.REGISTRATION_FAILURE,

  // События восстановления пароля
  [`${LogCategory.AUTH}.${AuthEvent.PASSWORD_RESET_REQUEST}`]: MetrikaEvent.PASSWORD_RESET_REQUEST,
  [`${LogCategory.AUTH}.${AuthEvent.PASSWORD_RESET_SUCCESS}`]: MetrikaEvent.PASSWORD_RESET_SUCCESS,
  [`${LogCategory.AUTH}.${AuthEvent.PASSWORD_RESET_FAILURE}`]: MetrikaEvent.PASSWORD_RESET_FAILURE,

  // События 2FA
  [`${LogCategory.AUTH}.${AuthEvent.TWO_FACTOR_SETUP}`]: MetrikaEvent.TWO_FACTOR_SETUP,
  [`${LogCategory.AUTH}.${AuthEvent.TWO_FACTOR_ENABLE}`]: MetrikaEvent.TWO_FACTOR_ENABLE,
  [`${LogCategory.AUTH}.${AuthEvent.TWO_FACTOR_DISABLE}`]: MetrikaEvent.TWO_FACTOR_DISABLE,
  [`${LogCategory.AUTH}.${AuthEvent.TWO_FACTOR_VERIFY_SUCCESS}`]:
    MetrikaEvent.TWO_FACTOR_VERIFY_SUCCESS,
  [`${LogCategory.AUTH}.${AuthEvent.TWO_FACTOR_VERIFY_FAILURE}`]:
    MetrikaEvent.TWO_FACTOR_VERIFY_FAILURE,
  [`${LogCategory.AUTH}.${AuthEvent.TWO_FACTOR_METHODS_LOADED}`]:
    MetrikaEvent.TWO_FACTOR_METHODS_LOADED,

  // События профиля
  [`${LogCategory.AUTH}.${AuthEvent.PROFILE_UPDATE}`]: MetrikaEvent.PROFILE_UPDATE,
  [`${LogCategory.AUTH}.${AuthEvent.EMAIL_CHANGE}`]: MetrikaEvent.EMAIL_CHANGE,
  [`${LogCategory.AUTH}.${AuthEvent.PASSWORD_CHANGE}`]: MetrikaEvent.PASSWORD_CHANGE,

  // События безопасности
  [`${LogCategory.AUTH}.${AuthEvent.SECURITY_SETTING_CHANGE}`]:
    MetrikaEvent.SECURITY_SETTING_CHANGE,
  [`${LogCategory.AUTH}.${AuthEvent.ACCOUNT_LOCK}`]: MetrikaEvent.ACCOUNT_LOCK,
  [`${LogCategory.AUTH}.${AuthEvent.ACCOUNT_UNLOCK}`]: MetrikaEvent.ACCOUNT_UNLOCK,

  // События сессии
  [`${LogCategory.AUTH}.${AuthEvent.SESSION_CREATED}`]: MetrikaEvent.SESSION_CREATED,
  [`${LogCategory.AUTH}.${AuthEvent.SESSION_EXPIRED}`]: MetrikaEvent.SESSION_EXPIRED,
  [`${LogCategory.AUTH}.${AuthEvent.SESSION_TERMINATED}`]: MetrikaEvent.SESSION_TERMINATED,

  // События Telegram аутентификации
  [`${LogCategory.AUTH}.${AuthEvent.TELEGRAM_AUTH_INIT}`]: MetrikaEvent.TELEGRAM_AUTH_INIT,
  [`${LogCategory.AUTH}.${AuthEvent.TELEGRAM_AUTH_SUCCESS}`]: MetrikaEvent.TELEGRAM_AUTH_SUCCESS,
  [`${LogCategory.AUTH}.${AuthEvent.TELEGRAM_AUTH_FAILURE}`]: MetrikaEvent.TELEGRAM_AUTH_FAILURE,
  [`${LogCategory.AUTH}.${AuthEvent.TELEGRAM_AUTH_CONFIRM_SUCCESS}`]:
    MetrikaEvent.TELEGRAM_AUTH_CONFIRM_SUCCESS,
  [`${LogCategory.AUTH}.${AuthEvent.TELEGRAM_AUTH_CONFIRM_FAILURE}`]:
    MetrikaEvent.TELEGRAM_AUTH_CONFIRM_FAILURE,
  [`${LogCategory.AUTH}.${AuthEvent.TELEGRAM_AUTH_BINDING}`]: MetrikaEvent.TELEGRAM_AUTH_BINDING,

  // Общие события авторизации
  [`${LogCategory.AUTH}.${AuthEvent.SYSTEM_EVENT}`]: MetrikaEvent.AUTHORIZATION,
}

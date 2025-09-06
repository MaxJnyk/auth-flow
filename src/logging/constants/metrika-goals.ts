import { MetrikaEvent } from './metrika-events'

/**
 * Соответствие UUID события в логе событий и идентификатора цели в метрике.
 * Используется для двухуровневого маппинга:
 * 1. AuthEvent -> MetrikaEvent (UUID) через metrikaEventMap
 * 2. MetrikaEvent (UUID) -> Yandex Metrika Goal ID через YM_GOALS
 */
export const YM_GOALS: Record<MetrikaEvent, string> = {
  // События входа
  [MetrikaEvent.LOGIN_ATTEMPT]: 'e5a7b61e-8a0c-4f5d-9a3f-6c2d8bb5e5a1',
  [MetrikaEvent.LOGIN_SUCCESS]: 'f8c3d7a9-6b5e-4e2d-8c1f-9a7b6d5e4c3a',
  [MetrikaEvent.LOGIN_FAILURE]: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  [MetrikaEvent.LOGOUT]: 'd7e8f9a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a',

  // События регистрации
  [MetrikaEvent.REGISTRATION_ATTEMPT]: 'c5d6e7f8-9a0b-1c2d-3e4f-5a6b7c8d9e0f',
  [MetrikaEvent.REGISTRATION_SUCCESS]: 'a0d5b017-b664-46ea-b4e2-b3b5d70473da', // Используем ID из основного проекта
  [MetrikaEvent.REGISTRATION_FAILURE]: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',

  // События восстановления пароля
  [MetrikaEvent.PASSWORD_RESET_REQUEST]: 'f1e2d3c4-b5a6-7f8e-9d0c-1b2a3c4d5e6f',
  [MetrikaEvent.PASSWORD_RESET_SUCCESS]: 'a9b8c7d6-e5f4-3a2b-1c0d-9e8f7a6b5c4d',
  [MetrikaEvent.PASSWORD_RESET_FAILURE]: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',

  // События 2FA
  [MetrikaEvent.TWO_FACTOR_SETUP]: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d',
  [MetrikaEvent.TWO_FACTOR_ENABLE]: '7a6b5c4d-3e2f-1a0b-9c8d-7e6f5a4b3c2d',
  [MetrikaEvent.TWO_FACTOR_DISABLE]: '6a5b4c3d-2e1f-0a9b-8c7d-6e5f4a3b2c1d',
  [MetrikaEvent.TWO_FACTOR_VERIFY_SUCCESS]: '5a4b3c2d-1e0f-9a8b-7c6d-5e4f3a2b1c0d',
  [MetrikaEvent.TWO_FACTOR_VERIFY_FAILURE]: '4a3b2c1d-0e9f-8a7b-6c5d-4e3f2a1b0c9d',
  [MetrikaEvent.TWO_FACTOR_METHODS_LOADED]: '3a2b1c0d-9e8f-7a6b-5c4d-3e2f1a0b9c8d',

  // События профиля
  [MetrikaEvent.PROFILE_UPDATE]: '2a1b0c9d-8e7f-6a5b-4c3d-2e1f0a9b8c7d',
  [MetrikaEvent.EMAIL_CHANGE]: '1a0b9c8d-7e6f-5a4b-3c2d-1e0f9a8b7c6d',
  [MetrikaEvent.PASSWORD_CHANGE]: '0a9b8c7d-6e5f-4a3b-2c1d-0e9f8a7b6c5d',

  // События безопасности
  [MetrikaEvent.SECURITY_SETTING_CHANGE]: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  [MetrikaEvent.ACCOUNT_LOCK]: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3e',
  [MetrikaEvent.ACCOUNT_UNLOCK]: '7a6b5c4d-3e2f-1a0b-9c8d-7e6f5a4b3c2e',

  // События сессии
  [MetrikaEvent.SESSION_CREATED]: '6a5b4c3d-2e1f-0a9b-8c7d-6e5f4a3b2c1e',
  [MetrikaEvent.SESSION_EXPIRED]: '5a4b3c2d-1e0f-9a8b-7c6d-5e4f3a2b1c0e',
  [MetrikaEvent.SESSION_TERMINATED]: '4a3b2c1d-0e9f-8a7b-6c5d-4e3f2a1b0c9e',

  // События Telegram аутентификации
  [MetrikaEvent.TELEGRAM_AUTH_INIT]: '3a2b1c0d-9e8f-7a6b-5c4d-3e2f1a0b9c8e',
  [MetrikaEvent.TELEGRAM_AUTH_SUCCESS]: '2a1b0c9d-8e7f-6a5b-4c3d-2e1f0a9b8c7e',
  [MetrikaEvent.TELEGRAM_AUTH_FAILURE]: '1a0b9c8d-7e6f-5a4b-3c2d-1e0f9a8b7c6e',
  [MetrikaEvent.TELEGRAM_AUTH_CONFIRM_SUCCESS]: '0a9b8c7d-6e5f-4a3b-2c1d-0e9f8a7b6c5e',
  [MetrikaEvent.TELEGRAM_AUTH_CONFIRM_FAILURE]: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4f',
  [MetrikaEvent.TELEGRAM_AUTH_BINDING]: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3f',

  // Общие события авторизации
  [MetrikaEvent.AUTHORIZATION]: 'cc623e57-2eda-47fd-bfb1-1519a8172edb', // Используем ID из основного проекта
}

export enum AuthEvent {
  // События входа
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',

  // События регистрации
  REGISTRATION_ATTEMPT = 'registration_attempt',
  REGISTRATION_SUCCESS = 'registration_success',
  REGISTRATION_FAILURE = 'registration_failure',

  // События восстановления пароля
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  PASSWORD_RESET_FAILURE = 'password_reset_failure',

  // События 2FA
  TWO_FACTOR_SETUP = 'two_factor_setup',
  TWO_FACTOR_ENABLE = 'two_factor_enable',
  TWO_FACTOR_DISABLE = 'two_factor_disable',
  TWO_FACTOR_VERIFY_SUCCESS = 'two_factor_verify_success',
  TWO_FACTOR_VERIFY_FAILURE = 'two_factor_verify_failure',
  TWO_FACTOR_METHODS_LOADED = 'two_factor_methods_loaded',
  TWO_FACTOR_METHODS_LOAD_ERROR = 'two_factor_methods_load_error',

  // События профиля
  PROFILE_UPDATE = 'profile_update',
  EMAIL_CHANGE = 'email_change',
  PASSWORD_CHANGE = 'password_change',

  // События безопасности
  SECURITY_SETTING_CHANGE = 'security_setting_change',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCK = 'account_lock',
  ACCOUNT_UNLOCK = 'account_unlock',

  // События сессии
  SESSION_CREATED = 'session_created',
  SESSION_EXPIRED = 'session_expired',
  SESSION_TERMINATED = 'session_terminated',

  // События прав
  PERMISSION_CHECK = 'permission_check',
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_DENIED = 'permission_denied',

  // События Telegram аутентификации
  TELEGRAM_AUTH_INIT = 'telegram_auth_init',
  TELEGRAM_AUTH_SUCCESS = 'telegram_auth_success',
  TELEGRAM_AUTH_FAILURE = 'telegram_auth_failure',
  TELEGRAM_AUTH_POLLING_START = 'telegram_auth_polling_start',
  TELEGRAM_AUTH_POLLING_END = 'telegram_auth_polling_end',
  TELEGRAM_AUTH_CONFIRM_ATTEMPT = 'telegram_auth_confirm_attempt',
  TELEGRAM_AUTH_CONFIRM_SUCCESS = 'telegram_auth_confirm_success',
  TELEGRAM_AUTH_CONFIRM_FAILURE = 'telegram_auth_confirm_failure',
  TELEGRAM_AUTH_ABORT = 'telegram_auth_abort',
  TELEGRAM_AUTH_BINDING = 'telegram_auth_binding',

  // Системные события
  SYSTEM_EVENT = 'system_event',
}

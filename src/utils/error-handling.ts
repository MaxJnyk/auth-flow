export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum UserErrorType {
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  UPDATE_FAILED = 'UPDATE_FAILED',
  PASSWORD_CHANGE_FAILED = 'PASSWORD_CHANGE_FAILED',
  EMAIL_CHANGE_FAILED = 'EMAIL_CHANGE_FAILED',
  EMAIL_VERIFICATION_FAILED = 'EMAIL_VERIFICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum TwoFactorErrorType {
  INVALID_CODE = 'INVALID_CODE',
  CODE_EXPIRED = 'CODE_EXPIRED',
  METHOD_NOT_AVAILABLE = 'METHOD_NOT_AVAILABLE',
  SETUP_FAILED = 'SETUP_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AuthError extends Error {
  type: AuthErrorType
  data?: any
  constructor(message: string, type: AuthErrorType = AuthErrorType.UNKNOWN_ERROR, data?: any) {
    super(message)
    this.name = 'AuthError'
    this.type = type
    this.data = data
  }
}

export class UserError extends Error {
  type: UserErrorType
  data?: any

  constructor(message: string, type: UserErrorType = UserErrorType.UNKNOWN_ERROR, data?: any) {
    super(message)
    this.name = 'UserError'
    this.type = type
    this.data = data
  }
}

export class TwoFactorError extends Error {
  type: TwoFactorErrorType
  data?: any

  constructor(
    message: string,
    type: TwoFactorErrorType = TwoFactorErrorType.UNKNOWN_ERROR,
    data?: any,
  ) {
    super(message)
    this.name = 'TwoFactorError'
    this.type = type
    this.data = data
  }
}

export function handleHttpError(error: any): Error {
  if (error.response) {
    const { status, data } = error.response

    switch (status) {
      case 400:
        return new Error(data?.message || 'Неверный запрос')
      case 401:
        return new AuthError('Не авторизован', AuthErrorType.INVALID_CREDENTIALS)
      case 403:
        return new AuthError('Доступ запрещен', AuthErrorType.ACCOUNT_LOCKED)
      case 404:
        return new Error('Ресурс не найден')
      case 422:
        return new Error(data?.message || 'Ошибка валидации')
      case 429:
        return new Error('Слишком много запросов')
      case 500:
        return new Error('Внутренняя ошибка сервера')
      default:
        return new Error(`Ошибка HTTP: ${status}`)
    }
  }

  if (error.request) {
    return new Error('Ошибка сети. Проверьте подключение к интернету.')
  }
  return new Error(error.message || 'Произошла неизвестная ошибка')
}

export function handleAuthError(error: any): AuthError {
  if (error instanceof AuthError) {
    return error
  }
  if (error.response) {
    const { status, data } = error.response

    switch (status) {
      case 400:
        return new AuthError(data?.message || 'Неверный запрос', AuthErrorType.INVALID_CREDENTIALS)
      case 401:
        if (data?.reason === 'email_not_verified') {
          return new AuthError('Email не подтвержден', AuthErrorType.EMAIL_NOT_VERIFIED)
        }
        if (data?.reason === 'two_factor_required') {
          return new AuthError(
            'Требуется двухфакторная аутентификация',
            AuthErrorType.TWO_FACTOR_REQUIRED,
            data,
          )
        }
        return new AuthError('Неверные учетные данные', AuthErrorType.INVALID_CREDENTIALS)
      case 403:
        return new AuthError('Аккаунт заблокирован', AuthErrorType.ACCOUNT_LOCKED)
      case 429:
        return new AuthError('Слишком много попыток входа', AuthErrorType.UNKNOWN_ERROR)
      case 500:
        return new AuthError('Ошибка сервера аутентификации', AuthErrorType.SERVER_ERROR)
      default:
        return new AuthError(`Ошибка аутентификации: ${status}`, AuthErrorType.UNKNOWN_ERROR)
    }
  }
  if (error.request) {
    return new AuthError('Ошибка сети при аутентификации', AuthErrorType.NETWORK_ERROR)
  }
  return new AuthError(
    error.message || 'Неизвестная ошибка аутентификации',
    AuthErrorType.UNKNOWN_ERROR,
  )
}

export function localizeError(error: Error, locale: string = 'ru'): string {
  if (error instanceof AuthError) {
    return localizeAuthError(error, locale)
  }
  if (error instanceof UserError) {
    return localizeUserError(error, locale)
  }
  if (error instanceof TwoFactorError) {
    return localizeTwoFactorError(error, locale)
  }
  return error.message
}

function localizeAuthError(error: AuthError, locale: string): string {
  if (locale === 'ru') {
    switch (error.type) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return 'Неверный email или пароль'
      case AuthErrorType.ACCOUNT_LOCKED:
        return 'Аккаунт заблокирован. Пожалуйста, обратитесь в службу поддержки'
      case AuthErrorType.EMAIL_NOT_VERIFIED:
        return 'Email не подтвержден. Пожалуйста, проверьте вашу почту'
      case AuthErrorType.TWO_FACTOR_REQUIRED:
        return 'Требуется двухфакторная аутентификация'
      case AuthErrorType.REGISTRATION_FAILED:
        return 'Ошибка при регистрации. Пожалуйста, попробуйте еще раз'
      case AuthErrorType.TOKEN_EXPIRED:
        return 'Срок действия токена истек. Пожалуйста, войдите снова'
      case AuthErrorType.NETWORK_ERROR:
        return 'Ошибка сети. Проверьте подключение к интернету'
      case AuthErrorType.SERVER_ERROR:
        return 'Ошибка сервера. Пожалуйста, попробуйте позже'
      default:
        return error.message || 'Неизвестная ошибка аутентификации'
    }
  }

  switch (error.type) {
    case AuthErrorType.INVALID_CREDENTIALS:
      return 'Invalid email or password'
    case AuthErrorType.ACCOUNT_LOCKED:
      return 'Account is locked. Please contact support'
    case AuthErrorType.EMAIL_NOT_VERIFIED:
      return 'Email is not verified. Please check your inbox'
    case AuthErrorType.TWO_FACTOR_REQUIRED:
      return 'Two-factor authentication is required'
    case AuthErrorType.REGISTRATION_FAILED:
      return 'Registration failed. Please try again'
    case AuthErrorType.TOKEN_EXPIRED:
      return 'Token has expired. Please login again'
    case AuthErrorType.NETWORK_ERROR:
      return 'Network error. Please check your internet connection'
    case AuthErrorType.SERVER_ERROR:
      return 'Server error. Please try again later'
    default:
      return error.message || 'Unknown authentication error'
  }
}

function localizeUserError(error: UserError, locale: string): string {
  if (locale === 'ru') {
    switch (error.type) {
      case UserErrorType.PROFILE_NOT_FOUND:
        return 'Профиль пользователя не найден'
      case UserErrorType.UPDATE_FAILED:
        return 'Ошибка при обновлении профиля'
      case UserErrorType.PASSWORD_CHANGE_FAILED:
        return 'Ошибка при смене пароля'
      case UserErrorType.EMAIL_CHANGE_FAILED:
        return 'Ошибка при смене email'
      case UserErrorType.EMAIL_VERIFICATION_FAILED:
        return 'Ошибка при подтверждении email'
      case UserErrorType.NETWORK_ERROR:
        return 'Ошибка сети. Проверьте подключение к интернету'
      case UserErrorType.SERVER_ERROR:
        return 'Ошибка сервера. Пожалуйста, попробуйте позже'
      default:
        return error.message || 'Неизвестная ошибка пользователя'
    }
  }

  switch (error.type) {
    case UserErrorType.PROFILE_NOT_FOUND:
      return 'User profile not found'
    case UserErrorType.UPDATE_FAILED:
      return 'Profile update failed'
    case UserErrorType.PASSWORD_CHANGE_FAILED:
      return 'Password change failed'
    case UserErrorType.EMAIL_CHANGE_FAILED:
      return 'Email change failed'
    case UserErrorType.EMAIL_VERIFICATION_FAILED:
      return 'Email verification failed'
    case UserErrorType.NETWORK_ERROR:
      return 'Network error. Please check your internet connection'
    case UserErrorType.SERVER_ERROR:
      return 'Server error. Please try again later'
    default:
      return error.message || 'Unknown user error'
  }
}

function localizeTwoFactorError(error: TwoFactorError, locale: string): string {
  if (locale === 'ru') {
    switch (error.type) {
      case TwoFactorErrorType.INVALID_CODE:
        return 'Неверный код подтверждения'
      case TwoFactorErrorType.CODE_EXPIRED:
        return 'Срок действия кода истек. Запросите новый код'
      case TwoFactorErrorType.METHOD_NOT_AVAILABLE:
        return 'Выбранный метод двухфакторной аутентификации недоступен'
      case TwoFactorErrorType.SETUP_FAILED:
        return 'Ошибка при настройке двухфакторной аутентификации'
      case TwoFactorErrorType.NETWORK_ERROR:
        return 'Ошибка сети. Проверьте подключение к интернету'
      case TwoFactorErrorType.SERVER_ERROR:
        return 'Ошибка сервера. Пожалуйста, попробуйте позже'
      default:
        return error.message || 'Неизвестная ошибка двухфакторной аутентификации'
    }
  }

  switch (error.type) {
    case TwoFactorErrorType.INVALID_CODE:
      return 'Invalid verification code'
    case TwoFactorErrorType.CODE_EXPIRED:
      return 'Code has expired. Please request a new one'
    case TwoFactorErrorType.METHOD_NOT_AVAILABLE:
      return 'Selected two-factor authentication method is not available'
    case TwoFactorErrorType.SETUP_FAILED:
      return 'Two-factor authentication setup failed'
    case TwoFactorErrorType.NETWORK_ERROR:
      return 'Network error. Please check your internet connection'
    case TwoFactorErrorType.SERVER_ERROR:
      return 'Server error. Please try again later'
    default:
      return error.message || 'Unknown two-factor authentication error'
  }
}

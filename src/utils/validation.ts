/**
 * Проверяет валидность email адреса
 * - Только латинские символы
 * - Наличие @ и домена (.ru, .com и т.д.)
 */
export function isValidEmail(email: string): boolean {
  // Проверяем только латинские символы, наличие @ и домена
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

/**
 * Проверяет валидность пароля
 * - Не менее 8 символов
 * - Минимум 1 цифра
 * - Минимум 1 заглавная буква
 */
export function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/
  return passwordRegex.test(password)
}

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Проверяет валидность телефонного номера
 * - Наличие +7 в начале
 * - Корректная длина номера
 * - Только цифры (без спецсимволов и скобок)
 * @param phone Телефонный номер для проверки
 * @returns {boolean} Результат валидации
 */
export function isValidPhone(phone: string): boolean {
  // Проверяем формат +7XXXXXXXXXX (10 цифр после +7)
  const phoneRegex = /^\+7\d{10}$/
  return phoneRegex.test(phone)
}

/**
 * Форматирует телефонный номер в стандартный формат +7XXXXXXXXXX
 * Удаляет скобки, пробелы, дефисы и другие спецсимволы
 * @param phone Телефонный номер в любом формате
 * @returns {string} Отформатированный номер в формате +7XXXXXXXXXX
 */
export function formatPhoneNumber(phone: string): string {
  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, '')

  // Если номер начинается с 8, заменяем на 7
  const normalizedDigits = digits.startsWith('8') ? `7${digits.substring(1)}` : digits

  // Если номер не начинается с 7, добавляем 7 в начало
  const withCountryCode = normalizedDigits.startsWith('7')
    ? normalizedDigits
    : `7${normalizedDigits}`

  // Добавляем + в начало
  return `+${withCountryCode}`
}

export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

export function isLengthValid(value: string, minLength: number, maxLength: number): boolean {
  const length = value.length
  return length >= minLength && length <= maxLength
}

export function isEqual<T>(value1: T, value2: T): boolean {
  return value1 === value2
}

/**
 * Проверяет валидность никнейма
 * - Только латинские символы
 * - Без пробелов и специальных символов
 * @param username Никнейм для проверки
 * @returns {boolean} Результат валидации
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  return usernameRegex.test(username)
}

/**
 * Проверяет валидность никнейма в Telegram
 * - Только латинские символы
 * - Без пробелов и специальных символов
 * @param telegramUsername Никнейм в Telegram для проверки
 * @returns {boolean} Результат валидации
 */
export function isValidTelegramUsername(telegramUsername: string): boolean {
  // Telegram username может начинаться с @ или без него
  const username = telegramUsername.startsWith('@')
    ? telegramUsername.substring(1)
    : telegramUsername

  // Правила Telegram: 5-32 символа, только латинские буквы, цифры и подчеркивания
  const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/
  return telegramRegex.test(username)
}

/**
 * Форматирует никнейм в Telegram, добавляя @ если его нет
 * @param telegramUsername Никнейм в Telegram
 * @returns {string} Отформатированный никнейм с @
 */
export function formatTelegramUsername(telegramUsername: string): string {
  if (!telegramUsername) return ''
  return telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`
}

/**
 * Проверяет валидность кода 2FA
 * - Проверяет только наличие кода
 * @param code Код 2FA
 * @returns {boolean} Результат валидации
 */
export function isValid2FACode(code: string): boolean {
  return !!code && code.trim().length > 0
}

export function validateObject<T extends Record<string, any>>(
  obj: T,
  rules: Record<keyof T, (value: any) => boolean>,
): { isValid: boolean; errors: Partial<Record<keyof T, boolean>> } {
  const errors: Partial<Record<keyof T, boolean>> = {}
  let isValid = true

  for (const key in rules) {
    if (Object.prototype.hasOwnProperty.call(rules, key)) {
      const isFieldValid = rules[key](obj[key])
      if (!isFieldValid) {
        errors[key] = true
        isValid = false
      }
    }
  }

  return { isValid, errors }
}

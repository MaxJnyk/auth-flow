/// <reference types="cypress" />

export {} // Превращаем файл в модуль

/**
 * Тесты для проверки двухфакторной аутентификации
 *
 * Эти тесты проверяют функциональность двухфакторной аутентификации (2FA)
 * в соответствии с API библиотеки auth-flow, включая:
 * - Инициализацию 2FA
 * - Отображение доступных методов 2FA
 * - Процесс верификации кода
 * - Обработку ошибок
 * - Успешную аутентификацию
 */
describe('Two-Factor Authentication Flow', () => {
  beforeEach(() => {
    // Очищаем состояние перед каждым тестом
    cy.clearLocalStorage()
    cy.clearCookies()

    // Устанавливаем базовое состояние - пользователь уже прошел первичную аутентификацию
    cy.window().then(win => {
      // Имитируем состояние после успешной первичной аутентификации
      // но требующее 2FA
      win.localStorage.setItem('auth_session_id', 'test-session-id')
      win.localStorage.setItem(
        'auth_pending',
        JSON.stringify({
          requiresTwoFactor: true,
          sessionId: 'test-session-id',
        }),
      )
    })

    // Мокаем API для получения доступных методов 2FA
    cy.intercept('GET', '**/auth/two-factor/methods', {
      statusCode: 200,
      body: {
        methods: [
          {
            id: 'email-method-id',
            type: 'email',
            isAvailable: true,
            isConfigured: true,
            maskedIdentifier: 'e***l@example.com',
          },
          {
            id: 'telegram-method-id',
            type: 'telegram',
            isAvailable: true,
            isConfigured: true,
          },
          {
            id: 'totp-method-id',
            type: 'totp',
            isAvailable: true,
            isConfigured: false,
          },
        ],
      },
    }).as('getTwoFactorMethods')

    // Мокаем API для запроса кода подтверждения
    cy.intercept('POST', '**/auth/two-factor/request-code', {
      statusCode: 200,
      body: { success: true },
    }).as('requestTwoFactorCode')

    // Мокаем API для верификации кода
    cy.intercept('POST', '**/auth/two-factor/verify', {
      statusCode: 200,
      body: {
        isSuccess: true,
        tokens: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
        },
      },
    }).as('verifyTwoFactorCode')
  })

  it('should handle successful 2FA verification', () => {
    cy.visit('/two-factor')

    // Мокаем успешный ответ API при проверке кода
    cy.intercept('POST', '**/verify-2fa', {
      statusCode: 200,
      body: { success: true },
    }).as('verify2FA')

    // Проверяем успешную верификацию
    cy.get('[data-testid="2fa-code-input"]').type('123456')
    cy.get('[data-testid="2fa-submit-button"]').click()
    cy.wait('@verify2FA')

    // Проверяем успешное завершение
    cy.url().should('include', '/dashboard')
  })

  it('должен отображать доступные методы 2FA и позволять выбрать метод', () => {
    // Переходим на страницу 2FA
    cy.visit('/two-factor')

    // Проверяем, что запрос методов 2FA был выполнен
    cy.wait('@getTwoFactorMethods')

    // Проверяем отображение доступных методов
    cy.get('[data-testid="2fa-method-list"]').should('be.visible')
    cy.get('[data-testid="2fa-method-email"]').should('be.visible')
    cy.get('[data-testid="2fa-method-telegram"]').should('be.visible')

    // Выбираем метод email
    cy.get('[data-testid="2fa-method-email"]').click()

    // Проверяем, что запрос на отправку кода был выполнен
    cy.wait('@requestTwoFactorCode')

    // Проверяем, что отображается форма ввода кода
    cy.get('[data-testid="2fa-code-input"]').should('be.visible')
    cy.get('[data-testid="2fa-masked-identifier"]').should('contain', 'e***l@example.com')
  })

  it('должен успешно верифицировать правильный код и перенаправлять пользователя', () => {
    cy.visit('/two-factor')
    cy.wait('@getTwoFactorMethods')

    // Выбираем метод email
    cy.get('[data-testid="2fa-method-email"]').click()
    cy.wait('@requestTwoFactorCode')

    // Вводим код верификации
    cy.get('[data-testid="2fa-code-input"]').type('123456')
    cy.get('[data-testid="2fa-submit-button"]').click()

    // Проверяем, что запрос на верификацию кода был выполнен
    cy.wait('@verifyTwoFactorCode')

    // Проверяем, что токены были сохранены в localStorage
    cy.window().then(win => {
      const tokens = JSON.parse(win.localStorage.getItem('auth_tokens') || '{}')
      expect(tokens.accessToken).to.equal('test-access-token')
      expect(tokens.refreshToken).to.equal('test-refresh-token')
    })

    // Проверяем, что пользователь перенаправлен на главную страницу
    cy.url().should('include', '/dashboard')
  })

  it('должен обрабатывать неверный код верификации', () => {
    // Мокаем API для проверки неверного кода
    cy.intercept('POST', '**/auth/two-factor/verify', {
      statusCode: 400,
      body: {
        isSuccess: false,
        error: 'Неверный код верификации',
      },
    }).as('verifyInvalidCode')

    cy.visit('/two-factor')
    cy.wait('@getTwoFactorMethods')

    // Выбираем метод email
    cy.get('[data-testid="2fa-method-email"]').click()
    cy.wait('@requestTwoFactorCode')

    // Вводим неверный код
    cy.get('[data-testid="2fa-code-input"]').type('999999')
    cy.get('[data-testid="2fa-submit-button"]').click()

    // Проверяем, что запрос на верификацию кода был выполнен
    cy.wait('@verifyInvalidCode')

    // Проверяем, что отображается сообщение об ошибке
    cy.get('[data-testid="2fa-error-message"]')
      .should('be.visible')
      .and('contain', 'Неверный код верификации')

    // Проверяем, что пользователь остался на странице 2FA
    cy.url().should('include', '/two-factor')
  })

  it('должен позволять запросить новый код верификации', () => {
    cy.visit('/two-factor')
    cy.wait('@getTwoFactorMethods')

    // Выбираем метод email
    cy.get('[data-testid="2fa-method-email"]').click()
    cy.wait('@requestTwoFactorCode')

    // Нажимаем на кнопку для повторной отправки кода
    cy.get('[data-testid="2fa-resend-button"]').click()

    // Проверяем, что запрос на отправку нового кода был выполнен
    cy.wait('@requestTwoFactorCode')

    cy.intercept('POST', '**/request-new-code', {
      statusCode: 200,
      body: { success: true },
    }).as('requestNewCode')

    cy.get('[data-testid="request-new-code-button"]').click()

    cy.wait('@requestNewCode')

    // Проверяем, что отображается сообщение об успешной отправке
    cy.get('[data-testid="code-sent-message"]').should('be.visible')
  })
})

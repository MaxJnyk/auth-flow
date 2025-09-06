/// <reference types="cypress" />

export {} // Превращаем файл в модуль

/**
 * Тесты для проверки аутентификации через Telegram
 *
 * Эти тесты проверяют функциональность аутентификации через Telegram
 * в соответствии с API библиотеки auth-flow, включая:
 * - Инициализацию аутентификации
 * - Отображение QR-кода и ссылки
 * - Процесс подтверждения аутентификации
 * - Обработку ошибок
 * - Поддержку двухфакторной аутентификации
 */
describe('Telegram Authentication Flow', () => {
  beforeEach(() => {
    // Очищаем состояние перед каждым тестом
    cy.clearLocalStorage()
    cy.clearCookies()

    // Мокаем API для инициализации Telegram аутентификации
    cy.intercept('POST', '**/auth/telegram/init', {
      statusCode: 200,
      body: {
        id: 'test-session-id',
        url: 'https://t.me/test_auth_bot?start=code123',
        code: 'code123',
        qr: 'data:image/png;base64,test-qr-code',
        linkToBot: 'https://t.me/test_auth_bot',
      },
    }).as('initTelegramAuth')

    // Мокаем API для подтверждения аутентификации
    cy.intercept('POST', '**/auth/telegram/confirm', {
      statusCode: 200,
      body: {
        isSuccess: true,
        tokens: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      },
    }).as('confirmTelegramAuth')
  })

  it('должен инициализировать аутентификацию через Telegram и отображать QR-код', () => {
    // Переходим на страницу логина
    cy.visit('/login')

    // Нажимаем на кнопку входа через Telegram
    cy.get('[data-testid="telegram-login-button"]').click()

    // Проверяем, что запрос на инициализацию был выполнен
    cy.wait('@initTelegramAuth')

    // Проверяем, что QR-код отображается
    cy.get('[data-testid="telegram-qr-code"]').should('be.visible')
    cy.get('[data-testid="telegram-auth-code"]').should('contain', 'code123')
    cy.get('[data-testid="telegram-auth-link"]').should(
      'have.attr',
      'href',
      'https://t.me/test_auth_bot?start=code123',
    )
  })

  it('должен успешно подтверждать аутентификацию и сохранять токены', () => {
    // Имитируем состояние после инициализации аутентификации
    cy.window().then(win => {
      win.localStorage.setItem('auth_session_id', 'test-session-id')
    })

    // Переходим на страницу подтверждения
    cy.visit('/auth/telegram/confirm')

    // Имитируем автоматический запрос на подтверждение
    cy.wait('@confirmTelegramAuth')

    // Проверяем, что токены были сохранены в localStorage
    cy.window().then(win => {
      const tokens = JSON.parse(win.localStorage.getItem('auth_tokens') || '{}')
      expect(tokens.accessToken).to.equal('test-access-token')
      expect(tokens.refreshToken).to.equal('test-refresh-token')
    })

    // Проверяем, что пользователь перенаправлен на главную страницу
    cy.url().should('include', '/dashboard')
  })

  it('должен обрабатывать ошибки при инициализации аутентификации', () => {
    // Мокаем ошибку при инициализации
    cy.intercept('POST', '**/auth/telegram/init', {
      statusCode: 500,
      body: {
        error: 'Ошибка сервера при инициализации аутентификации',
      },
    }).as('initTelegramAuthError')

    // Переходим на страницу логина
    cy.visit('/login')

    // Нажимаем на кнопку входа через Telegram
    cy.get('[data-testid="telegram-login-button"]').click()

    // Проверяем, что запрос на инициализацию был выполнен
    cy.wait('@initTelegramAuthError')

    // Проверяем, что отображается сообщение об ошибке
    cy.get('[data-testid="telegram-auth-error"]')
      .should('be.visible')
      .and('contain', 'Ошибка сервера при инициализации аутентификации')
  })

  it('должен обрабатывать ошибки при подтверждении аутентификации', () => {
    // Имитируем состояние после инициализации аутентификации
    cy.window().then(win => {
      win.localStorage.setItem('auth_session_id', 'test-session-id')
    })

    // Мокаем ошибку при подтверждении
    cy.intercept('POST', '**/auth/telegram/confirm', {
      statusCode: 400,
      body: {
        isSuccess: false,
        error: 'Невозможно подтвердить аутентификацию',
      },
    }).as('confirmTelegramAuthError')

    // Переходим на страницу подтверждения
    cy.visit('/auth/telegram/confirm')

    // Имитируем автоматический запрос на подтверждение
    cy.wait('@confirmTelegramAuthError')

    // Проверяем, что отображается сообщение об ошибке
    cy.get('[data-testid="telegram-confirm-error"]')
      .should('be.visible')
      .and('contain', 'Невозможно подтвердить аутентификацию')

    // Проверяем, что пользователь остался на странице подтверждения
    cy.url().should('include', '/auth/telegram/confirm')
  })

  it('должен поддерживать отмену процесса аутентификации', () => {
    // Переходим на страницу логина
    cy.visit('/login')

    // Нажимаем на кнопку входа через Telegram
    cy.get('[data-testid="telegram-login-button"]').click()
    cy.wait('@initTelegramAuth')

    // Нажимаем на кнопку отмены
    cy.get('[data-testid="telegram-auth-cancel"]').click()

    // Проверяем, что пользователь вернулся на страницу логина
    cy.url().should('include', '/login')

    // Проверяем, что сессия была очищена
    cy.window().then(win => {
      expect(win.localStorage.getItem('auth_session_id')).to.be.null
    })
  })

  it('должен поддерживать двухфакторную аутентификацию после Telegram', () => {
    // Мокаем API для подтверждения с требованием 2FA
    cy.intercept('POST', '**/auth/telegram/confirm', {
      statusCode: 200,
      body: {
        isSuccess: true,
        requiresTwoFactor: true,
        twoFactorMethods: [
          {
            id: 'email-method-id',
            type: 'email',
            isAvailable: true,
            isConfigured: true,
            maskedIdentifier: 'e***l@example.com',
          },
        ],
        id: 'two-factor-session-id',
      },
    }).as('confirmTelegramAuthWith2FA')

    // Имитируем состояние после инициализации аутентификации
    cy.window().then(win => {
      win.localStorage.setItem('auth_session_id', 'test-session-id')
    })

    // Переходим на страницу подтверждения
    cy.visit('/auth/telegram/confirm')

    // Имитируем автоматический запрос на подтверждение
    cy.wait('@confirmTelegramAuthWith2FA')

    // Проверяем, что пользователь перенаправлен на страницу 2FA
    cy.url().should('include', '/two-factor')

    // Проверяем, что в localStorage сохранена информация о необходимости 2FA
    cy.window().then(win => {
      const authPending = JSON.parse(win.localStorage.getItem('auth_pending') || '{}')
      expect(authPending.requiresTwoFactor).to.be.true
      expect(authPending.sessionId).to.equal('two-factor-session-id')
    })
  })
})

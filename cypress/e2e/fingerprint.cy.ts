/// <reference types="cypress" />

// Объявляем типы для FingerprintJS
declare global {
  interface Window {
    FingerprintJS?: {
      load: () => Promise<{
        get: () => Promise<{
          visitorId: string
        }>
      }>
    }
  }
}

export {} // Превращаем файл в модуль

describe('Fingerprint Functionality', () => {
  beforeEach(() => {
    // Сбрасываем состояние перед каждым тестом
    cy.clearLocalStorage()
    cy.clearCookies()

    // Мокаем функцию получения отпечатка устройства
    cy.window().then(win => {
      win.FingerprintJS = {
        load: cy.stub().resolves({
          get: cy.stub().resolves({
            visitorId: 'test-fingerprint-id',
          }),
        }),
      }
    })
  })

  it('should generate fingerprint on page load', () => {
    // Мокаем запрос к API для проверки отпечатка
    cy.intercept('POST', '**/api/fingerprint/verify', {
      statusCode: 200,
      body: { valid: true },
    }).as('verifyFingerprint')

    // Посещаем страницу входа
    cy.visit('/login')

    // Проверяем, что запрос на проверку отпечатка был отправлен
    cy.wait('@verifyFingerprint')
      .its('request.body')
      .should('have.property', 'fingerprint', 'test-fingerprint-id')
  })

  it('should handle suspicious fingerprint detection', () => {
    // Мокаем запрос к API для проверки отпечатка с подозрительным результатом
    cy.intercept('POST', '**/api/fingerprint/verify', {
      statusCode: 200,
      body: {
        valid: false,
        suspicious: true,
        reason: 'location_change',
      },
    }).as('suspiciousFingerprint')

    // Посещаем страницу входа
    cy.visit('/login')

    // Проверяем, что запрос на проверку отпечатка был отправлен
    cy.wait('@suspiciousFingerprint')

    // Проверяем, что отображается предупреждение о подозрительной активности
    cy.get('[data-testid="suspicious-activity-warning"]').should('be.visible')
    cy.get('[data-testid="suspicious-activity-warning"]').should(
      'contain',
      'Обнаружена подозрительная активность',
    )
  })

  it('should store fingerprint in local storage', () => {
    cy.visit('/login')

    // Проверяем, что отпечаток сохранен в localStorage
    cy.window().then(win => {
      const storedFingerprint = win.localStorage.getItem('device_fingerprint')
      expect(storedFingerprint).to.equal('test-fingerprint-id')
    })
  })

  it('should include fingerprint in authentication requests', () => {
    // Посещаем страницу входа
    cy.visit('/login')

    // Мокаем запрос аутентификации
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { token: 'test-token' },
    }).as('loginRequest')

    // Заполняем форму входа и отправляем
    cy.get('[data-testid="email-input"]').type('test@example.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()

    // Проверяем, что запрос на вход содержит отпечаток
    cy.wait('@loginRequest')
      .its('request.body')
      .should('have.property', 'fingerprint', 'test-fingerprint-id')
  })
})

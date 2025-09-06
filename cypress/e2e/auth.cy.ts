/// <reference types="cypress" />

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

// Расширяем глобальный интерфейс Window
export {} // Добавляем export для превращения файла в модуль

declare global {
  interface Window {
    Telegram?: {
      AuthWidget?: {
        dataOnauth: (user: TelegramUser) => void
      }
    }
  }
}

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Сбрасываем состояние перед каждым тестом
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  it('should display login form', () => {
    cy.visit('/login')
    cy.get('[data-testid="login-form"]').should('be.visible')
  })

  it('should handle Telegram authentication widget', () => {
    cy.visit('/login')
    cy.get('[data-testid="telegram-login-button"]').should('be.visible')

    // Мокаем Telegram виджет
    cy.window().then(win => {
      win.Telegram = {
        AuthWidget: {
          dataOnauth: (_user: TelegramUser) => {
            // Симулируем успешную аутентификацию
            cy.get('[data-testid="auth-status"]').should('contain', 'Authenticated')
          },
        },
      }
    })

    // Триггерим событие авторизации
    cy.get('[data-testid="telegram-login-button"]').click()
  })

  it('should handle authentication errors', () => {
    cy.visit('/login')
    cy.intercept('POST', '**/auth/telegram', {
      statusCode: 401,
      body: { error: 'Authentication failed' },
    }).as('authFailed')

    cy.get('[data-testid="telegram-login-button"]').click()
    cy.wait('@authFailed')
    cy.get('[data-testid="auth-error"]').should('be.visible')
  })
})

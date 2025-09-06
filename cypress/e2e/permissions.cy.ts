/// <reference types="cypress" />

export {} // Превращаем файл в модуль

describe('Permissions and Protected Routes', () => {
  beforeEach(() => {
    // Сбрасываем состояние перед каждым тестом
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  it('should redirect unauthenticated users to login page', () => {
    // Пытаемся посетить защищенный маршрут без авторизации
    cy.visit('/dashboard')

    // Проверяем, что произошло перенаправление на страницу входа
    cy.url().should('include', '/login')
  })

  it('should allow access to protected routes for authenticated users', () => {
    // Имитируем авторизованного пользователя
    cy.window().then(win => {
      win.localStorage.setItem('auth_token', 'test-token')
      win.localStorage.setItem(
        'user',
        JSON.stringify({
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
          requires2FA: false,
          permissions: ['read:dashboard'],
        }),
      )
    })

    // Посещаем защищенный маршрут
    cy.visit('/dashboard')

    // Проверяем, что доступ разрешен (страница загружена)
    cy.get('[data-testid="dashboard-content"]').should('be.visible')
  })

  it('should handle permission-based access control', () => {
    // Имитируем пользователя с ограниченными правами
    cy.window().then(win => {
      win.localStorage.setItem('auth_token', 'test-token')
      win.localStorage.setItem(
        'user',
        JSON.stringify({
          id: '123',
          name: 'Limited User',
          email: 'limited@example.com',
          requires2FA: false,
          permissions: ['read:dashboard'], // Нет прав на admin
        }),
      )
    })

    // Пытаемся посетить страницу, требующую прав администратора
    cy.visit('/admin')

    // Проверяем, что доступ запрещен и отображается сообщение об ошибке
    cy.get('[data-testid="permission-denied"]').should('be.visible')
  })

  it('should allow access to admin area for users with admin permissions', () => {
    // Имитируем пользователя с правами администратора
    cy.window().then(win => {
      win.localStorage.setItem('auth_token', 'test-token')
      win.localStorage.setItem(
        'user',
        JSON.stringify({
          id: '123',
          name: 'Admin User',
          email: 'admin@example.com',
          requires2FA: false,
          permissions: ['read:dashboard', 'admin:access'],
        }),
      )
    })

    // Посещаем страницу администратора
    cy.visit('/admin')

    // Проверяем, что доступ разрешен
    cy.get('[data-testid="admin-panel"]').should('be.visible')
  })

  it('should handle token expiration', () => {
    // Имитируем пользователя с истекшим токеном
    cy.window().then(win => {
      win.localStorage.setItem('auth_token', 'expired-token')
      win.localStorage.setItem(
        'user',
        JSON.stringify({
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
        }),
      )
    })

    // Мокаем ответ API с ошибкой истекшего токена
    cy.intercept('GET', '**/api/user-profile', {
      statusCode: 401,
      body: { error: 'Token expired' },
    }).as('expiredToken')

    // Посещаем защищенный маршрут
    cy.visit('/dashboard')

    // Ждем запрос к API
    cy.wait('@expiredToken')

    // Проверяем, что произошло перенаправление на страницу входа
    cy.url().should('include', '/login')

    // Проверяем, что отображается сообщение об истекшей сессии
    cy.get('[data-testid="session-expired-message"]').should('be.visible')
  })
})

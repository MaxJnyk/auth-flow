/**
 * Тесты для LoggerProvider и useLogger
 * @module test/logging/react/logger-context.test
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, type Mocked } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LoggerProvider, useLogger } from '../../../src/logging/react/logger-context'
import { AuthEvent, LogCategory, LogLevel, LogSource } from '../../../src/logging/models'
import { LoggerService } from '../../../src/logging/services'

// Мок LoggerService
vi.mock('../../../src/logging/services')

const TestComponent = () => {
  const {
    context,
    updateContext,
    log,
    logAuth,
    logSecurity,
    logProfile,
    enableLogging,
    disableLogging,
    isLoggingEnabled,
  } = useLogger()

  return (
    <div>
      <div data-testid="context">{JSON.stringify(context)}</div>
      <div data-testid="is-enabled">{isLoggingEnabled.toString()}</div>
      <button onClick={() => updateContext({ sessionId: 'new-session' })}>Update</button>
      <button
        onClick={() =>
          log({
            level: LogLevel.INFO,
            action: 'test_action',
            category: LogCategory.SYSTEM,
            source: LogSource.FRONTEND,
          })
        }
      >
        Log
      </button>
      <button onClick={() => logAuth(AuthEvent.LOGIN_SUCCESS)}>Log Auth</button>
      <button onClick={() => logSecurity(AuthEvent.SUSPICIOUS_ACTIVITY)}>Log Security</button>
      <button onClick={() => logProfile(AuthEvent.PROFILE_UPDATE)}>Log Profile</button>
      <button onClick={() => enableLogging()}>Enable</button>
      <button onClick={() => disableLogging()}>Disable</button>
    </div>
  )
}

describe('LoggerProvider and useLogger', () => {
  let mockLogger: Mocked<LoggerService>

  beforeEach(() => {
    // Создаем экземпляр мокнутого сервиса
    mockLogger = new LoggerService() as Mocked<LoggerService>
    // Мокаем console.error, чтобы не засорять вывод тестов
    console.error = vi.fn()
    vi.clearAllMocks()
  })

  it('должен предоставлять logger и context через useLogger', () => {
    const initialContext = { userId: 'initial-user' }
    render(
      <LoggerProvider logger={mockLogger} initialContext={initialContext}>
        <TestComponent />
      </LoggerProvider>,
    )

    expect(screen.getByTestId('context').textContent).toBe(JSON.stringify(initialContext))
  })

  it('должен вызывать ошибку, если useLogger используется вне провайдера', () => {
    const TestComponentWithoutProvider = () => {
      useLogger()
      return null
    }
    expect(() => render(<TestComponentWithoutProvider />)).toThrow(
      'useLogger must be used within a LoggerProvider',
    )
  })

  it('должен обновлять контекст через updateContext', () => {
    render(
      <LoggerProvider logger={mockLogger}>
        <TestComponent />
      </LoggerProvider>,
    )

    act(() => {
      screen.getByText('Update').click()
    })

    expect(screen.getByTestId('context').textContent).toContain('new-session')
    expect(mockLogger.updateDefaultContext).toHaveBeenCalledWith({ sessionId: 'new-session' })
  })

  it('должен вызывать соответствующие методы логирования', () => {
    render(
      <LoggerProvider logger={mockLogger}>
        <TestComponent />
      </LoggerProvider>,
    )

    act(() => {
      screen.getByText('Log Auth').click()
    })
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ category: LogCategory.AUTH }),
      expect.any(Object),
    )

    act(() => {
      screen.getByText('Log Security').click()
    })
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ category: LogCategory.SECURITY }),
      expect.any(Object),
    )

    act(() => {
      screen.getByText('Log Profile').click()
    })
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ category: LogCategory.PROFILE }),
      expect.any(Object),
    )
  })

  it('должен управлять состоянием включения/отключения логирования', () => {
    render(
      <LoggerProvider logger={mockLogger} logEnabled={true}>
        <TestComponent />
      </LoggerProvider>,
    )

    expect(screen.getByTestId('is-enabled').textContent).toBe('true')

    act(() => {
      screen.getByText('Disable').click()
    })
    expect(mockLogger.disable).toHaveBeenCalled()
    expect(screen.getByTestId('is-enabled').textContent).toBe('false')

    act(() => {
      screen.getByText('Enable').click()
    })
    expect(mockLogger.enable).toHaveBeenCalled()
    expect(screen.getByTestId('is-enabled').textContent).toBe('true')
  })
})

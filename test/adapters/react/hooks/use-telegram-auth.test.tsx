/**
 * Тесты для хука useTelegramAuth
 * @module test/adapters/react/hooks/use-telegram-auth.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTelegramAuth } from '../../../../src/adapters/react/hooks/use-telegram-auth'
import { TelegramAuthService } from '../../../../src/domain/services/telegram-auth'
import { AuthStore } from '../../../../src/adapters/store/auth-store'
import { LoggerService } from '../../../../src/logging/services/logger.service'
import { TgSignInOptions } from '../../../../src/domain/models/auth.models'

// Мокируем сервисы
vi.mock('../../../../src/domain/services/telegram-auth')
vi.mock('../../../../src/logging/services/logger.service')

describe('useTelegramAuth simplified tests', () => {
  let telegramAuthService: Partial<TelegramAuthService>
  let authStore: AuthStore
  let logger: Partial<LoggerService>

  const mockSignInOptions: TgSignInOptions = {
    botName: 'test_bot',
    redirectUrl: 'https://example.com/callback',
  }

  const mockSignInResult = {
    url: 'https://t.me/test_bot?start=code123',
    id: 'session123',
  }

  beforeEach(() => {
    authStore = new AuthStore()
    telegramAuthService = {
      initSignIn: vi.fn().mockResolvedValue(mockSignInResult),
    }
    logger = {
      log: vi.fn(),
    }
    vi.clearAllMocks()
  })

  it('should call initSignIn and update state correctly', async () => {
    const { result } = renderHook(() =>
      useTelegramAuth(
        telegramAuthService as TelegramAuthService,
        authStore,
        undefined,
        {},
        logger as LoggerService,
      ),
    )

    await act(async () => {
      await result.current.initSignIn(mockSignInOptions)
    })

    expect(telegramAuthService.initSignIn).toHaveBeenCalledWith({
      ...mockSignInOptions,
      isBinding: false,
    })
    expect(result.current.authUrl).toBe(mockSignInResult.url)
    expect(result.current.sessionId).toBe(mockSignInResult.id)
    expect(logger.log).toHaveBeenCalled()
  })
})

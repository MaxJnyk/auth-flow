/**
 * Тесты для хука useTwoFactor
 * @module test/adapters/react/hooks/use-two-factor.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTwoFactor } from '../../../../src/adapters/react/hooks/use-two-factor'
import { TwoFactorStore } from '../../../../src/adapters/store/two-factor-store'
import { TwoFactorService } from '../../../../src/domain/services/two-factor.service'
import { LoggerService } from '../../../../src/logging/services/logger.service'
import {
  TwoFactorMethod,
  TwoFactorMethodType,
  UserProfile,
} from '../../../../src/domain/models/auth.models'
import { SmsTwoFactorSetupData } from '../../../../src/domain/models/two-factor-setup.model'

vi.mock('../../../../src/domain/services/two-factor.service')
vi.mock('../../../../src/logging/services/logger.service')

describe('useTwoFactor', () => {
  let twoFactorStore: TwoFactorStore
  let twoFactorService: TwoFactorService
  let logger: LoggerService

  const mockMethod: TwoFactorMethod = {
    id: '1',
    type: TwoFactorMethodType.SMS,
    maskedIdentifier: '+79001234567',
    isAvailable: true,
    isConfigured: true,
  }

  beforeEach(() => {
    twoFactorStore = new TwoFactorStore()

    twoFactorService = {
      verifyCode: vi.fn(),
      sendCode: vi.fn(),
      getAvailableMethods: vi.fn(),
      setupMethod: vi.fn(),
      confirmMethodSetup: vi.fn(),
      disableMethod: vi.fn(),
    } as unknown as TwoFactorService

    logger = {
      log: vi.fn(),
    } as unknown as LoggerService

    vi.clearAllMocks()
  })

  it('должен возвращать начальное состояние', () => {
    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    expect(result.current.isRequired).toBe(false)
    expect(result.current.availableMethods).toEqual([])
    expect(result.current.selectedMethod).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.setupData).toBeNull()
  })

  it('должен устанавливать двухфакторную аутентификацию как обязательную', () => {
    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    act(() => {
      result.current.setTwoFactorRequired(true, [mockMethod])
    })

    expect(result.current.isRequired).toBe(true)
    expect(result.current.availableMethods).toEqual([mockMethod])
    expect(result.current.selectedMethod).toEqual(mockMethod)
    expect(logger.log).toHaveBeenCalled()
  })

  it('должен выбирать метод аутентификации', () => {
    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    act(() => {
      result.current.selectMethod(mockMethod)
    })

    expect(result.current.selectedMethod).toEqual(mockMethod)
    expect(logger.log).toHaveBeenCalled()
  })

  it('должен проверять код и возвращать успешный результат', async () => {
    const mockResult = {
      isSuccess: true,
      user: { id: '123', email: 'test@test.com' } as UserProfile,
    }
    vi.mocked(twoFactorService.verifyCode).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    // Сначала выбираем метод
    act(() => {
      result.current.selectMethod(mockMethod)
    })

    // Затем проверяем код
    let verifyResult
    await act(async () => {
      verifyResult = await result.current.verifyCode('123456')
    })

    expect(twoFactorService.verifyCode).toHaveBeenCalledWith('123456', mockMethod)
    expect(verifyResult).toEqual(mockResult)
    expect(result.current.isLoading).toBe(false)
    expect(logger.log).toHaveBeenCalled()
  })

  it('должен возвращать ошибку при проверке кода без выбранного метода', async () => {
    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    let verifyResult
    await act(async () => {
      verifyResult = await result.current.verifyCode('123456')
    })

    expect(verifyResult.isSuccess).toBe(false)
    expect(verifyResult.error).toBeDefined()
    expect(result.current.error).toBeDefined()
    expect(twoFactorService.verifyCode).not.toHaveBeenCalled()
  })

  it('должен отправлять код', async () => {
    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    // Сначала выбираем метод
    act(() => {
      result.current.selectMethod(mockMethod)
    })

    // Затем отправляем код
    await act(async () => {
      await result.current.sendCode()
    })

    expect(twoFactorService.sendCode).toHaveBeenCalledWith(mockMethod)
    expect(result.current.isLoading).toBe(false)
    expect(logger.log).toHaveBeenCalled()
  })

  it('должен обрабатывать ошибку при отправке кода', async () => {
    const mockError = new Error('Ошибка отправки')
    vi.mocked(twoFactorService.sendCode).mockRejectedValue(mockError)

    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    // Сначала выбираем метод
    act(() => {
      result.current.selectMethod(mockMethod)
    })

    // Затем отправляем код и ожидаем ошибку
    await act(async () => {
      await expect(result.current.sendCode()).rejects.toThrow()
    })

    expect(twoFactorService.sendCode).toHaveBeenCalledWith(mockMethod)
    expect(result.current.error).toBeDefined()
    expect(logger.log).toHaveBeenCalled()
  })

  it('должен получать доступные методы', async () => {
    const mockMethods = [mockMethod]
    vi.mocked(twoFactorService.getAvailableMethods).mockResolvedValue(mockMethods)

    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    let methods
    await act(async () => {
      methods = await result.current.getAvailableMethods()
    })

    expect(twoFactorService.getAvailableMethods).toHaveBeenCalled()
    expect(methods).toEqual(mockMethods)
    expect(logger.log).toHaveBeenCalled()
  })

  it('должен настраивать метод', async () => {
    const mockSetupData: SmsTwoFactorSetupData = {
      methodType: TwoFactorMethodType.SMS,
      maskedPhone: '+7900*****67',
    }
    vi.mocked(twoFactorService.setupMethod).mockResolvedValue({ setupData: mockSetupData })

    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    await act(async () => {
      await result.current.setupMethod(mockMethod)
    })

    expect(twoFactorService.setupMethod).toHaveBeenCalledWith(mockMethod)
    expect(result.current.setupData).toEqual(mockSetupData)
    expect(result.current.selectedMethod).toEqual(mockMethod)
    expect(logger.log).toHaveBeenCalled()
  })

  it('должен подтверждать настройку метода', async () => {
    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    // Сначала выбираем метод
    act(() => {
      result.current.selectMethod(mockMethod)
    })

    // Затем подтверждаем настройку
    await act(async () => {
      await result.current.confirmMethodSetup('123456')
    })

    expect(twoFactorService.confirmMethodSetup).toHaveBeenCalledWith(mockMethod, '123456')
    expect(result.current.setupData).toBeNull()
    expect(logger.log).toHaveBeenCalled()
  })

  it('должен отключать метод', async () => {
    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    await act(async () => {
      await result.current.disableMethod(mockMethod)
    })

    expect(twoFactorService.disableMethod).toHaveBeenCalledWith(mockMethod)
    expect(logger.log).toHaveBeenCalled()
  })

  it('должен сбрасывать состояние', () => {
    const { result } = renderHook(() => useTwoFactor(twoFactorService, twoFactorStore, logger))

    // Сначала изменяем состояние
    act(() => {
      result.current.setTwoFactorRequired(true, [mockMethod])
    })

    // Затем сбрасываем его
    act(() => {
      result.current.reset()
    })

    expect(result.current.isRequired).toBe(false)
    expect(result.current.availableMethods).toEqual([])
    expect(result.current.selectedMethod).toBeNull()
    expect(logger.log).toHaveBeenCalled()
  })
})

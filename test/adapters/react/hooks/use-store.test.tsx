/**
 * Тесты для хука useStore
 * @module test/adapters/react/hooks/use-store.test
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { useStore } from '../../../../src/adapters/react/hooks/use-store'
import { SimpleStore } from '../../../../src/adapters/store/simple-store'

interface TestState {
  count: number
  text: string
}

describe('useStore', () => {
  it('должен возвращать текущее состояние хранилища', () => {
    const initialState: TestState = { count: 0, text: 'initial' }
    const store = new SimpleStore<TestState>(initialState)

    const { result } = renderHook(() => useStore(store))

    expect(result.current).toEqual(initialState)
  })

  it('должен обновлять состояние при изменении хранилища', () => {
    const initialState: TestState = { count: 0, text: 'initial' }
    const store = new SimpleStore<TestState>(initialState)

    const { result } = renderHook(() => useStore(store))

    act(() => {
      store.setState({ count: 1, text: 'updated' })
    })

    expect(result.current).toEqual({ count: 1, text: 'updated' })
  })

  it('должен отписываться от хранилища при размонтировании', () => {
    const initialState: TestState = { count: 0, text: 'initial' }
    const store = new SimpleStore<TestState>(initialState)

    // Мокаем метод subscribe для отслеживания отписки
    const unsubscribeMock = vi.fn()
    const subscribeSpy = vi.spyOn(store, 'subscribe').mockReturnValue(unsubscribeMock)

    const { unmount } = renderHook(() => useStore(store))

    // Проверяем, что подписка была создана
    expect(subscribeSpy).toHaveBeenCalled()

    // Размонтируем компонент
    unmount()

    // Проверяем, что отписка была вызвана
    expect(unsubscribeMock).toHaveBeenCalled()
  })
})

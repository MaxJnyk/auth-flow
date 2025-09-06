/**
 * Тесты для SimpleStore
 * @module test/adapters/store/simple-store.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SimpleStore } from '../../../src/adapters/store/simple-store'

interface TestState {
  count: number
  text: string
}

describe('SimpleStore', () => {
  let store: SimpleStore<TestState>
  const initialState: TestState = { count: 0, text: 'initial' }

  beforeEach(() => {
    store = new SimpleStore<TestState>(initialState)
  })

  it('должен создавать хранилище с начальным состоянием', () => {
    expect(store.getState()).toEqual(initialState)
  })

  it('должен обновлять состояние с помощью объекта', () => {
    const newState = { count: 1, text: 'updated' }
    store.setState(newState)
    expect(store.getState()).toEqual(newState)
  })

  it('должен обновлять состояние с помощью функции', () => {
    store.setState(state => ({
      ...state,
      count: state.count + 1,
    }))
    expect(store.getState()).toEqual({ count: 1, text: 'initial' })
  })

  it('должен уведомлять подписчиков при изменении состояния', () => {
    const subscriber = vi.fn()
    store.subscribe(subscriber)

    store.setState({ count: 1, text: 'updated' })

    expect(subscriber).toHaveBeenCalledWith({ count: 1, text: 'updated' })
  })

  it('должен отписывать подписчиков', () => {
    const subscriber = vi.fn()
    const unsubscribe = store.subscribe(subscriber)

    unsubscribe()
    store.setState({ count: 1, text: 'updated' })

    expect(subscriber).not.toHaveBeenCalled()
  })

  it('должен уведомлять нескольких подписчиков', () => {
    const subscriber1 = vi.fn()
    const subscriber2 = vi.fn()

    store.subscribe(subscriber1)
    store.subscribe(subscriber2)

    store.setState({ count: 1, text: 'updated' })

    expect(subscriber1).toHaveBeenCalledWith({ count: 1, text: 'updated' })
    expect(subscriber2).toHaveBeenCalledWith({ count: 1, text: 'updated' })
  })

  it('не должен уведомлять подписчиков, если состояние не изменилось', () => {
    const subscriber = vi.fn()
    store.subscribe(subscriber)

    store.setState(initialState)

    expect(subscriber).not.toHaveBeenCalled()
  })
})

/**
 * Тесты для AuthStore
 * @module test/adapters/store/auth-store.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthStore, AuthState } from '../../../src/adapters/store/auth-store'
import { AuthTokens } from '../../../src/domain/models/auth.models'

describe('AuthStore', () => {
  let store: AuthStore

  beforeEach(() => {
    store = new AuthStore()
  })

  const getInitialState = (): AuthState => ({
    isAuthenticated: false,
    isLoading: false,
    tokens: null,
    error: null,
  })

  it('должен инициализироваться с начальным состоянием', () => {
    expect(store.getState()).toEqual(getInitialState())
  })

  describe('setLoading', () => {
    it('должен устанавливать isLoading в true и сбрасывать ошибку', () => {
      const setStateSpy = vi.spyOn(store, 'setState')
      store.setLoading(true)

      const updater = setStateSpy.mock.calls[0][0] as (state: AuthState) => AuthState
      const newState = updater({ ...getInitialState(), error: new Error('Old Error') })

      expect(newState.isLoading).toBe(true)
      expect(newState.error).toBeNull()
    })

    it('должен устанавливать isLoading в false, не изменяя ошибку', () => {
      const error = new Error('An error')
      const initialState = { ...getInitialState(), error }
      const setStateSpy = vi.spyOn(store, 'setState')

      store.setLoading(false)
      const updater = setStateSpy.mock.calls[0][0] as (state: AuthState) => AuthState
      const newState = updater(initialState)

      expect(newState.isLoading).toBe(false)
      expect(newState.error).toBe(error)
    })
  })

  describe('setAuthenticated', () => {
    it('должен устанавливать isAuthenticated и токены', () => {
      const tokens: AuthTokens = { accessToken: 'abc', refreshToken: 'def', expiresIn: 3600 }
      const setStateSpy = vi.spyOn(store, 'setState')

      store.setAuthenticated(true, tokens)
      const updater = setStateSpy.mock.calls[0][0] as (state: AuthState) => AuthState
      const newState = updater(getInitialState())

      expect(newState.isAuthenticated).toBe(true)
      expect(newState.tokens).toBe(tokens)
      expect(newState.error).toBeNull()
    })

    it('должен сбрасывать isAuthenticated и токены при выходе', () => {
      const initialState: AuthState = {
        ...getInitialState(),
        isAuthenticated: true,
        tokens: { accessToken: 'abc', refreshToken: 'def', expiresIn: 3600 },
      }
      const setStateSpy = vi.spyOn(store, 'setState')

      store.setAuthenticated(false, null)
      const updater = setStateSpy.mock.calls[0][0] as (state: AuthState) => AuthState
      const newState = updater(initialState)

      expect(newState.isAuthenticated).toBe(false)
      expect(newState.tokens).toBeNull()
    })
  })

  describe('setError', () => {
    it('должен устанавливать ошибку и сбрасывать isLoading', () => {
      const error = new Error('Test Error')
      const initialState = { ...getInitialState(), isLoading: true }
      const setStateSpy = vi.spyOn(store, 'setState')

      store.setError(error)
      const updater = setStateSpy.mock.calls[0][0] as (state: AuthState) => AuthState
      const newState = updater(initialState)

      expect(newState.error).toBe(error)
      expect(newState.isLoading).toBe(false)
    })
  })

  describe('reset', () => {
    it('должен сбрасывать состояние к начальному', () => {
      const initialState: AuthState = {
        isAuthenticated: true,
        isLoading: false,
        tokens: { accessToken: 'abc', refreshToken: 'def', expiresIn: 3600 },
        error: new Error('Some Error'),
      }
      store.setState(initialState)

      store.reset()
      expect(store.getState()).toEqual(getInitialState())
    })
  })
})

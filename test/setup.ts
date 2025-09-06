import { vi, beforeAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeAll(() => {
  if (!global.document) {
    Object.defineProperty(global, 'document', {
      value: window.document,
      writable: true,
    })
  }
})

afterEach(() => {
  cleanup()
})

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })

Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
})

afterEach(() => {
  localStorageMock.clear()
  sessionStorageMock.clear()
  document.cookie = ''
  vi.clearAllMocks()
})

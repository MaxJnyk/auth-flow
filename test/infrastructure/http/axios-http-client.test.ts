/**
 * Тесты для AxiosHttpClient
 * @module test/infrastructure/http/axios-http-client.test
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import axios from 'axios'
import { AxiosHttpClient } from '../../../src/infrastructure/http/axios-http-client'

// Мокаем axios
interface MockedAxiosInstance {
  get: Mock
  post: Mock
  put: Mock
  patch: Mock
  delete: Mock
  interceptors: {
    request: { use: Mock }
    response: { use: Mock }
  }
  defaults: {
    baseURL?: string
    headers: {
      common: { [key: string]: string }
    }
  }
}

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      })),
    },
  }
})

describe('AxiosHttpClient', () => {
  let httpClient: AxiosHttpClient
  let axiosInstance: MockedAxiosInstance

  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    vi.clearAllMocks()

    // Создаем новый экземпляр HTTP клиента
    httpClient = new AxiosHttpClient()
    axiosInstance = (axios.create as Mock).mock.results[0].value
  })

  it('должен создавать экземпляр axios при инициализации', () => {
    expect(axios.create).toHaveBeenCalled()
  })

  it('должен выполнять GET запрос', async () => {
    const mockResponse = { data: { id: 1, name: 'Test' } }
    axiosInstance.get.mockResolvedValue(mockResponse)

    const result = await httpClient.get('/test')

    expect(axiosInstance.get).toHaveBeenCalledWith('/test', {})
    expect(result).toEqual(mockResponse)
  })

  it('должен выполнять POST запрос', async () => {
    const mockData = { name: 'Test' }
    const mockResponse = { data: { id: 1, name: 'Test' } }
    axiosInstance.post.mockResolvedValue(mockResponse)

    const result = await httpClient.post('/test', mockData)

    expect(axiosInstance.post).toHaveBeenCalledWith('/test', mockData, {})
    expect(result).toEqual(mockResponse)
  })

  it('должен выполнять PUT запрос', async () => {
    const mockData = { id: 1, name: 'Updated Test' }
    const mockResponse = { data: { id: 1, name: 'Updated Test' } }
    axiosInstance.put.mockResolvedValue(mockResponse)

    const result = await httpClient.put('/test/1', mockData)

    expect(axiosInstance.put).toHaveBeenCalledWith('/test/1', mockData, {})
    expect(result).toEqual(mockResponse)
  })

  it('должен выполнять PATCH запрос', async () => {
    const mockData = { name: 'Patched Test' }
    const mockResponse = { data: { id: 1, name: 'Patched Test' } }
    axiosInstance.patch.mockResolvedValue(mockResponse)

    const result = await httpClient.patch('/test/1', mockData)

    expect(axiosInstance.patch).toHaveBeenCalledWith('/test/1', mockData, {})
    expect(result).toEqual(mockResponse)
  })

  it('должен выполнять DELETE запрос', async () => {
    const mockResponse = { data: { success: true } }
    axiosInstance.delete.mockResolvedValue(mockResponse)

    const result = await httpClient.delete('/test/1')

    expect(axiosInstance.delete).toHaveBeenCalledWith('/test/1', {})
    expect(result).toEqual(mockResponse)
  })

  it('должен устанавливать базовый URL', () => {
    axiosInstance.defaults = { baseURL: '', headers: { common: {} } }

    httpClient.setBaseUrl('https://api.example.com')

    expect(axiosInstance.defaults.baseURL).toBe('https://api.example.com')
  })

  it('должен устанавливать заголовок', () => {
    axiosInstance.defaults = { headers: { common: {} } }

    httpClient.setHeader('Authorization', 'Bearer token')

    expect(axiosInstance.defaults.headers.common['Authorization']).toBe('Bearer token')
  })

  it('должен устанавливать перехватчик ответов', () => {
    const onSuccess = vi.fn()
    httpClient.setResponseInterceptor(onSuccess)
    expect((httpClient as unknown as { responseInterceptor: unknown }).responseInterceptor).toBe(
      onSuccess,
    )
  })

  it('должен устанавливать перехватчик ошибок', () => {
    const onError = vi.fn()
    httpClient.setErrorInterceptor(onError)

    expect((httpClient as unknown as { errorInterceptor: unknown }).errorInterceptor).toBe(onError)
  })

  it('должен удалять заголовок', () => {
    axiosInstance.defaults = { headers: { common: { Authorization: 'Bearer token' } } }

    httpClient.deleteHeader('Authorization')

    expect(axiosInstance.defaults.headers.common.Authorization).toBeUndefined()
  })

  it('должен передавать опции в GET запрос', async () => {
    const options = {
      headers: { 'X-Custom-Header': 'value' },
      params: { id: 1 },
      timeout: 5000,
      withCredentials: true,
    }

    await httpClient.get('/test', options)

    expect(axiosInstance.get).toHaveBeenCalledWith('/test', expect.objectContaining(options))
  })

  it('должен вызывать перехватчик ответа при успехе', async () => {
    const responseHandler = vi.fn(response => ({ ...response, intercepted: true }))
    httpClient.setResponseInterceptor(responseHandler)

    const mockResponse = { data: 'original' }
    axiosInstance.interceptors.response.use.mock.calls[0][0](mockResponse)

    expect(responseHandler).toHaveBeenCalledWith(mockResponse)
  })

  it('должен вызывать перехватчик ошибок при ошибке', async () => {
    const errorHandler = vi.fn(error => ({ ...error, intercepted: true }))
    httpClient.setErrorInterceptor(errorHandler)

    const mockError = new Error('Network Error')
    const errorPromise = axiosInstance.interceptors.response.use.mock.calls[0][1](mockError)

    await expect(errorPromise).rejects.toEqual({ ...mockError, intercepted: true })
    expect(errorHandler).toHaveBeenCalledWith(mockError)
  })
})

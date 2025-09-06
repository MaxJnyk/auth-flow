import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { HttpClient, RequestOptions } from './http-client.interface'

export class AxiosHttpClient implements HttpClient {
  private client: AxiosInstance
  private responseInterceptor?: (response: unknown) => unknown
  private errorInterceptor?: (error: unknown) => unknown

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.responseInterceptor) {
          return this.responseInterceptor(response)
        }
        return response.data
      },
      error => {
        if (this.errorInterceptor) {
          return Promise.reject(this.errorInterceptor(error))
        }
        return Promise.reject(error)
      },
    )
  }

  private mapOptions(options?: RequestOptions): AxiosRequestConfig {
    if (!options) return {}

    const config: AxiosRequestConfig = {}

    if (options.headers) {
      config.headers = options.headers
    }

    if (options.params) {
      config.params = options.params
    }

    if (options.timeout) {
      config.timeout = options.timeout
    }

    if (options.withCredentials !== undefined) {
      config.withCredentials = options.withCredentials
    }

    return config
  }

  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.client.get<unknown, T>(url, this.mapOptions(options))
  }
  async post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.client.post<unknown, T>(url, data, this.mapOptions(options))
  }
  async put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.client.put<unknown, T>(url, data, this.mapOptions(options))
  }
  async patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.client.patch<unknown, T>(url, data, this.mapOptions(options))
  }
  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.client.delete<unknown, T>(url, this.mapOptions(options))
  }
  setBaseUrl(url: string): void {
    this.client.defaults.baseURL = url
  }
  setHeader(name: string, value: string): void {
    this.client.defaults.headers.common[name] = value
  }
  deleteHeader(name: string): void {
    delete this.client.defaults.headers.common[name]
  }
  setResponseInterceptor(handler: (response: unknown) => unknown): void {
    this.responseInterceptor = handler
  }
  setErrorInterceptor(handler: (error: unknown) => unknown): void {
    this.errorInterceptor = handler
  }
}

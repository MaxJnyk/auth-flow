export type HttpQueryParams = Record<string, string | number | boolean | null | undefined>

export interface RequestOptions {
  headers?: Record<string, string>
  params?: HttpQueryParams
  timeout?: number
  withCredentials?: boolean
}

export interface HttpClient {
  get<T>(url: string, options?: RequestOptions): Promise<T>
  post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>
  put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>
  patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>
  delete<T>(url: string, options?: RequestOptions): Promise<T>
  setBaseUrl(url: string): void
  setHeader(name: string, value: string): void
  deleteHeader(name: string): void
  setResponseInterceptor(handler: (response: unknown) => unknown): void
  setErrorInterceptor(handler: (error: unknown) => unknown): void
}

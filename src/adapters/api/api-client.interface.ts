export type QueryParams = Record<string, string | number | boolean | null | undefined>

export interface ApiClient {
  get<T = unknown>(url: string, params?: QueryParams, headers?: Record<string, string>): Promise<T>
  post<T = unknown>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T>
  put<T = unknown>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T>
  delete<T = unknown>(
    url: string,
    params?: QueryParams,
    headers?: Record<string, string>,
  ): Promise<T>
}

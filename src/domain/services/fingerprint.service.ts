import { BuiltinComponents } from '@fingerprintjs/fingerprintjs'

/**
 * Интерфейс сервиса для работы с фингерпринтом
 */
export interface FingerprintService {
  /**
   * Получить уникальный идентификатор посетителя (фингерпринт)
   */
  getFingerprint(): Promise<string>

  /**
   * Получить полные данные о посетителе, включая компоненты фингерпринта
   */
  getVisitorData(): Promise<{
    visitorId: string
    components: BuiltinComponents
  }>

  /**
   * Отправить данные фингерпринта на сервер
   * @param data Данные фингерпринта для отправки
   */
  sendFingerprint(data: { fpId: string; fpComponents: BuiltinComponents }): Promise<{ id: string }>
}

import { LogContext, LogEvent } from '../models'
import { LoggerService, LoggerOptions } from './logger.service'
import { FingerprintService } from '../../domain/services/fingerprint.service'

export interface FingerprintLoggerOptions extends LoggerOptions {
  includeFingerprint?: boolean
}
export class FingerprintLoggerService extends LoggerService {
  private fingerprintService: FingerprintService
  private cachedFingerprint: string | null = null
  private fingerprintPromise: Promise<string> | null = null
  private fingerprintOptions: FingerprintLoggerOptions

  constructor(fingerprintService: FingerprintService, options: FingerprintLoggerOptions = {}) {
    super([], options)
    this.fingerprintService = fingerprintService
    this.fingerprintOptions = {
      ...options,
      includeFingerprint: options.includeFingerprint !== false,
    }
  }

  private async getFingerprint(): Promise<string> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint
    }

    if (!this.fingerprintPromise) {
      this.fingerprintPromise = this.fingerprintService
        .getFingerprint()
        .then(fingerprint => {
          this.cachedFingerprint = fingerprint
          return fingerprint
        })
        .catch(error => {
          console.error('Failed to get fingerprint:', error)
          return ''
        })
    }

    return this.fingerprintPromise
  }

  /**
   * Расширяет контекст логов данными фингерпринта
   */
  private async enrichContextWithFingerprint(
    context?: Partial<LogContext>,
  ): Promise<Partial<LogContext>> {
    if (!this.fingerprintOptions.includeFingerprint) {
      return context || {}
    }

    try {
      const fingerprint = await this.getFingerprint()
      return {
        ...context,
        fingerprint,
      }
    } catch (error) {
      console.error('Error enriching log context with fingerprint:', error)
      return context || {}
    }
  }

  async log(event: LogEvent, context?: Partial<LogContext>): Promise<void> {
    const enrichedContext = await this.enrichContextWithFingerprint(context)
    super.log(event, enrichedContext)
  }

  async batchLog(events: LogEvent[], context?: Partial<LogContext>): Promise<void> {
    const enrichedContext = await this.enrichContextWithFingerprint(context)
    super.batchLog(events, enrichedContext)
  }

  /**
   * Обновляет настройки логгера
   */
  updateOptions(options: FingerprintLoggerOptions): void {
    this.fingerprintOptions = {
      ...this.fingerprintOptions,
      ...options,
    }
    super.updateOptions(options)
  }

  resetFingerprintCache(): void {
    this.cachedFingerprint = null
    this.fingerprintPromise = null
  }
}

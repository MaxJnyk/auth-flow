import { FingerprintService } from '../../domain/services/fingerprint.service'
import type { Agent, BuiltinComponents } from '@fingerprintjs/fingerprintjs'
import { FingerprintApiAdapter } from '../../adapters/api/fingerprint/api'

export interface FingerprintJsServiceOptions {
  loadDelay?: number
  visitorIdKey?: string
  componentsKey?: string
  useDynamicImport?: boolean
}

export class FingerprintJsService implements FingerprintService {
  private fpPromise: Promise<Agent> | null = null
  private visitorIdCache: string | null = null
  private componentsCache: BuiltinComponents | null = null
  private sessionStorageAvailable: boolean
  private readonly loadDelay: number
  private readonly VISITOR_ID_KEY: string
  private readonly FP_COMPONENTS_KEY: string
  private readonly useDynamicImport: boolean

  constructor(
    private readonly fingerprintApiAdapter?: FingerprintApiAdapter,
    options: FingerprintJsServiceOptions = {},
  ) {
    this.loadDelay = options.loadDelay || 0
    this.VISITOR_ID_KEY = options.visitorIdKey || 'auth_visitor_id'
    this.FP_COMPONENTS_KEY = options.componentsKey || 'auth_fp_components'
    this.useDynamicImport = options.useDynamicImport !== false
    this.sessionStorageAvailable = this.isSessionStorageAvailable()

    if (this.sessionStorageAvailable) {
      try {
        const cachedVisitorId = sessionStorage.getItem(this.VISITOR_ID_KEY)
        const cachedComponents = sessionStorage.getItem(this.FP_COMPONENTS_KEY)

        if (cachedVisitorId) {
          this.visitorIdCache = cachedVisitorId
        }

        if (cachedComponents) {
          this.componentsCache = JSON.parse(cachedComponents)
        }
      } catch (error) {
        console.error('Failed to load fingerprint from SessionStorage:', error)
      }
    }
  }

  private isSessionStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__'
      sessionStorage.setItem(testKey, testKey)
      sessionStorage.removeItem(testKey)
      return true
    } catch (e) {
      return false
    }
  }

  private initAgent(): Promise<Agent> {
    if (!this.fpPromise) {
      this.fpPromise = new Promise<Agent>(resolve => {
        setTimeout(async () => {
          try {
            if (this.useDynamicImport) {
              const FingerprintJS = await import('@fingerprintjs/fingerprintjs')
              const agent = await FingerprintJS.load()
              resolve(agent)
            } else {
              // Статический импорт (для совместимости со старыми проектами)
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const FingerprintJS = require('@fingerprintjs/fingerprintjs')
              const agent = await FingerprintJS.load()
              resolve(agent)
            }
          } catch (error) {
            console.error('Failed to load FingerprintJS:', error)
            resolve({
              get: async () => ({
                visitorId: 'error-loading-fingerprint',
                components: {} as BuiltinComponents,
              }),
            } as Agent)
          }
        }, this.loadDelay)
      })
    }
    return this.fpPromise
  }

  private async fetchVisitorData(): Promise<{
    visitorId: string
    components: BuiltinComponents
  }> {
    if (this.visitorIdCache && this.componentsCache) {
      return {
        visitorId: this.visitorIdCache,
        components: this.componentsCache,
      }
    }

    const agent = await this.initAgent()
    const result = await agent.get()
    this.visitorIdCache = result.visitorId
    this.componentsCache = result.components

    if (this.sessionStorageAvailable) {
      try {
        sessionStorage.setItem(this.VISITOR_ID_KEY, result.visitorId)
        sessionStorage.setItem(this.FP_COMPONENTS_KEY, JSON.stringify(result.components))
      } catch (error) {
        console.error('Failed to save fingerprint to SessionStorage:', error)
      }
    }

    return {
      visitorId: result.visitorId,
      components: result.components,
    }
  }

  async getFingerprint(): Promise<string> {
    const data = await this.fetchVisitorData()
    return data.visitorId
  }

  async getVisitorData(): Promise<{
    visitorId: string
    components: BuiltinComponents
  }> {
    return this.fetchVisitorData()
  }

  async sendFingerprint(data: {
    fpId: string
    fpComponents: BuiltinComponents
  }): Promise<{ id: string }> {
    if (!this.fingerprintApiAdapter) {
      return { id: data.fpId }
    }
    const response = await this.fingerprintApiAdapter.sendFingerprint({
      fpId: data.fpId,
      fpComponents: data.fpComponents,
    })
    this.fingerprintApiAdapter.setSessionHeader(response.id)

    return response
  }
}

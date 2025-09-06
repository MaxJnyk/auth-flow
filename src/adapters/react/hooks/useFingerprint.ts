import { useEffect, useState } from 'react'
import { BuiltinComponents } from '@fingerprintjs/fingerprintjs'
import { FingerprintService } from '../../../domain/services/fingerprint.service'

export interface UseFingerprintOptions {
  delay?: number
  autoSend?: boolean
  onSuccess?: (visitorId: string, components: BuiltinComponents) => void
  onError?: (error: Error) => void
  setSessionHeader?: (sessionId: string) => void
}

export interface FingerprintData {
  visitorId: string | null
  components: BuiltinComponents | null
  isLoading: boolean
  error: Error | null
  getFingerprint: () => Promise<void>
  sendFingerprint: () => Promise<{ id: string } | null>
}

export const useFingerprint = (
  fingerprintService: FingerprintService,
  options: UseFingerprintOptions = {},
): FingerprintData => {
  const { delay = 5000, autoSend = false, onSuccess, onError, setSessionHeader } = options

  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [components, setComponents] = useState<BuiltinComponents | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const getFingerprint = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await fingerprintService.getVisitorData()

      setVisitorId(data.visitorId)
      setComponents(data.components)

      if (setSessionHeader) {
        setSessionHeader(data.visitorId)
      }

      if (onSuccess) {
        onSuccess(data.visitorId, data.components)
      }

      if (autoSend && data.visitorId && data.components) {
        await sendFingerprint()
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get fingerprint')
      setError(error)

      if (onError) {
        onError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const sendFingerprint = async (): Promise<{ id: string } | null> => {
    if (!visitorId || !components) {
      return null
    }

    try {
      return await fingerprintService.sendFingerprint({
        fpId: visitorId,
        fpComponents: components,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send fingerprint')
      setError(error)

      if (onError) {
        onError(error)
      }

      return null
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      getFingerprint()
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  return {
    visitorId,
    components,
    isLoading,
    error,
    getFingerprint,
    sendFingerprint,
  }
}

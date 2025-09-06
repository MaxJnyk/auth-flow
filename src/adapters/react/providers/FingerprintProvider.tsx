import React, { createContext, PropsWithChildren, useContext, useEffect } from 'react'
import { BuiltinComponents } from '@fingerprintjs/fingerprintjs'
import { FingerprintService } from '../../../domain/services/fingerprint.service'
import { useFingerprint, UseFingerprintOptions } from '../hooks/useFingerprint'

export interface FingerprintContextType {
  visitorId: string | null
  components: BuiltinComponents | null
  isLoading: boolean
  error: Error | null
  getFingerprint: () => Promise<void>
  sendFingerprint: () => Promise<{ id: string } | null>
}

const FingerprintContext = createContext<FingerprintContextType | null>(null)

export interface FingerprintProviderProps extends PropsWithChildren {
  fingerprintService: FingerprintService
  options?: UseFingerprintOptions
}

export const FingerprintProvider: React.FC<FingerprintProviderProps> = ({
  children,
  fingerprintService,
  options = {},
}) => {
  const fingerprintData = useFingerprint(fingerprintService, {
    ...options,
    autoSend: options.autoSend ?? true,
  })

  useEffect(() => {
    if (options.setSessionHeader && fingerprintData.visitorId && fingerprintData.components) {
      fingerprintData.sendFingerprint().then(result => {
        if (result && result.id) {
          options.setSessionHeader!(result.id)
        }
      })
    }
  }, [fingerprintData.visitorId, options.setSessionHeader])

  return (
    <FingerprintContext.Provider value={fingerprintData}>{children}</FingerprintContext.Provider>
  )
}

export const useFingerPrintContext = (): FingerprintContextType => {
  const context = useContext(FingerprintContext)

  if (!context) {
    throw new Error('useFingerPrintContext must be used within a FingerprintProvider')
  }

  return context
}

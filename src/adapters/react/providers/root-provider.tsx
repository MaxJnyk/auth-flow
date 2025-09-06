import { FC, ReactNode } from 'react'
import { AuthRootProvider, AuthRootProviderProps } from './auth-root-provider'
import { FingerprintProvider } from './FingerprintProvider'
import { FingerprintService } from '../../../domain/services/fingerprint.service'
import { HttpClient } from '../../../infrastructure/http/http-client.interface'
import { UseFingerprintOptions } from '../hooks/useFingerprint'
import { FingerprintApiAdapter } from '../../api/fingerprint/api'
import {
  FingerprintJsService,
  FingerprintJsServiceOptions,
} from '../../../infrastructure/services/fingerprint.service'

export interface RootProviderProps {
  children: ReactNode
  authRootProviderProps: AuthRootProviderProps
  fingerprintService?: FingerprintService
  fingerprintOptions?: UseFingerprintOptions
  httpClient?: HttpClient
  fingerprintApiPath?: string
  fingerprintSendPath?: string
  fingerprintServiceOptions?: FingerprintJsServiceOptions
  createFingerprintService?: boolean
  fingerprintLoadDelay?: number
}

export const RootProvider: FC<RootProviderProps> = ({
  children,
  authRootProviderProps,
  fingerprintService,
  fingerprintOptions = {},
  httpClient,
  fingerprintApiPath,
  fingerprintSendPath,
  fingerprintServiceOptions = {},
  createFingerprintService = false,
  fingerprintLoadDelay = 0,
}) => {
  const fingerprintApiAdapter = httpClient
    ? new FingerprintApiAdapter(httpClient, fingerprintApiPath, fingerprintSendPath)
    : undefined
  const actualFingerprintService =
    fingerprintService ||
    (createFingerprintService
      ? new FingerprintJsService(fingerprintApiAdapter, {
          ...fingerprintServiceOptions,
          loadDelay: fingerprintLoadDelay || fingerprintServiceOptions.loadDelay || 0,
        })
      : undefined)

  const fingerprintOpts =
    httpClient && actualFingerprintService
      ? {
          ...fingerprintOptions,
          setSessionHeader: (sessionId: string) => {
            httpClient.setHeader('X-Session', sessionId)
          },
        }
      : fingerprintOptions

  if (actualFingerprintService) {
    const updatedFingerprintService =
      fingerprintApiAdapter && fingerprintService
        ? Object.assign(fingerprintService, { fingerprintApiAdapter })
        : actualFingerprintService

    return (
      <FingerprintProvider fingerprintService={updatedFingerprintService} options={fingerprintOpts}>
        <AuthRootProvider {...authRootProviderProps}>{children}</AuthRootProvider>
      </FingerprintProvider>
    )
  }

  return <AuthRootProvider {...authRootProviderProps}>{children}</AuthRootProvider>
}

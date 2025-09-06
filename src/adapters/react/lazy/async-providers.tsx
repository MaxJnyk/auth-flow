import React, { Suspense, ReactNode } from 'react'
import type { RootProviderProps } from '../providers/root-provider'
import type { FingerprintProviderProps } from '../providers/FingerprintProvider'
import type { AuthRootProviderProps } from '../providers/auth-root-provider'

const DefaultFallback = () => <div>Loading authentication components...</div>

type AsyncComponentProps = {
  fallback?: ReactNode
  children?: ReactNode
}

const LazyRootProvider = React.lazy(() =>
  import('../providers/root-provider').then(module => ({
    default: module.RootProvider,
  })),
)

export const AsyncRootProvider: React.FC<RootProviderProps & AsyncComponentProps> = ({
  children,
  fallback = <DefaultFallback />,
  ...props
}) => (
  <Suspense fallback={fallback}>
    <LazyRootProvider {...props}>{children}</LazyRootProvider>
  </Suspense>
)

const LazyFingerprintProvider = React.lazy(() =>
  import('../providers/FingerprintProvider').then(module => ({
    default: module.FingerprintProvider,
  })),
)

export const AsyncFingerprintProvider: React.FC<FingerprintProviderProps & AsyncComponentProps> = ({
  children,
  fallback = <DefaultFallback />,
  ...props
}) => (
  <Suspense fallback={fallback}>
    <LazyFingerprintProvider {...props}>{children}</LazyFingerprintProvider>
  </Suspense>
)

const LazyAuthRootProvider = React.lazy(() =>
  import('../providers/auth-root-provider').then(module => ({
    default: module.AuthRootProvider,
  })),
)

export const AsyncAuthRootProvider: React.FC<AuthRootProviderProps & AsyncComponentProps> = ({
  children,
  fallback = <DefaultFallback />,
  ...props
}) => (
  <Suspense fallback={fallback}>
    <LazyAuthRootProvider {...props}>{children}</LazyAuthRootProvider>
  </Suspense>
)

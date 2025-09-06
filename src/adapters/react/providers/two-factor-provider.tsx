import { FC, ReactNode } from 'react'
import { TwoFactorContext } from './two-factor-context'
import { TwoFactorService } from '../../../domain/services/two-factor.service'
import { TwoFactorStore } from '../../store/two-factor-store'
import { useTwoFactor } from '../hooks/use-two-factor'

export interface TwoFactorProviderProps {
  children: ReactNode
  twoFactorService: TwoFactorService
  twoFactorStore: TwoFactorStore
}

export const TwoFactorProvider: FC<TwoFactorProviderProps> = ({
  children,
  twoFactorService,
  twoFactorStore,
}) => {
  const twoFactorState = useTwoFactor(twoFactorService, twoFactorStore)

  return <TwoFactorContext.Provider value={twoFactorState}>{children}</TwoFactorContext.Provider>
}

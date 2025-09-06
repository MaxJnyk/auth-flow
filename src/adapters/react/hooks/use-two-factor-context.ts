import { useContext } from 'react'
import { TwoFactorContext, TwoFactorContextValue } from '../providers/two-factor-context'

export function useTwoFactorContext(): TwoFactorContextValue {
  const context = useContext(TwoFactorContext)

  if (!context) {
    throw new Error('useTwoFactorContext должен использоваться внутри TwoFactorProvider')
  }

  return context
}

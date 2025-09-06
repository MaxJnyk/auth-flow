import { useContext } from 'react'
import { AuthContext, AuthContextValue } from '../providers/auth-context'

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext должен использоваться внутри AuthProvider')
  }

  return context
}

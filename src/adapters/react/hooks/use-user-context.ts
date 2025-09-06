import { useContext } from 'react'
import { UserContext, UserContextValue } from '../providers/user-context'
export function useUserContext(): UserContextValue {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error('useUserContext должен использоваться внутри UserProvider')
  }

  return context
}

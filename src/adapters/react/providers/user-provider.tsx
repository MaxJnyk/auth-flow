import { FC, ReactNode, useContext, useEffect } from 'react'
import { UserContext } from './user-context'
import { UserService } from '../../../domain/services/user.service'
import { UserStore } from '../../store/user-store'
import { useUser } from '../hooks/use-user'
import { AuthContext } from './auth-context'

export interface UserProviderProps {
  children: ReactNode
  userService: UserService
  userStore: UserStore
  autoLoadUser?: boolean
}

export const UserProvider: FC<UserProviderProps> = ({
  children,
  userService,
  userStore,
  autoLoadUser = true,
}) => {
  const { isAuthenticated } = useContext(AuthContext)
  const userState = useUser(userService, userStore, isAuthenticated)

  useEffect(() => {
    if (autoLoadUser && isAuthenticated) {
      userState.loadUser()
    }
  }, [isAuthenticated, autoLoadUser, userState.loadUser])

  return <UserContext.Provider value={userState}>{children}</UserContext.Provider>
}

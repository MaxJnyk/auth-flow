import { SimpleStore } from './simple-store'
import { UserProfile } from '../../domain/models/user.models'

export interface UserState {
  user: UserProfile | null
  isLoading: boolean
  error: Error | null
}

const initialUserState: UserState = {
  user: null,
  isLoading: false,
  error: null,
}

export class UserStore extends SimpleStore<UserState> {
  constructor() {
    super(initialUserState)
  }

  setLoading(isLoading: boolean): void {
    this.setState(state => ({
      ...state,
      isLoading,
      error: isLoading ? null : state.error,
    }))
  }

  setUser(user: UserProfile | null): void {
    this.setState(state => ({
      ...state,
      user,
      error: null,
    }))
  }

  updateUser(userData: Partial<UserProfile>): void {
    this.setState(state => {
      if (!state.user) {
        return state
      }

      return {
        ...state,
        user: {
          ...state.user,
          ...userData,
        },
      }
    })
  }

  setError(error: Error | null): void {
    this.setState(state => ({
      ...state,
      error,
      isLoading: false,
    }))
  }

  reset(): void {
    this.setState(initialUserState)
  }
}

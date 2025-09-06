import { SimpleStore } from './simple-store'
import { AuthTokens } from '../../domain/models/auth.models'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  tokens: AuthTokens | null
  error: Error | null
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  tokens: null,
  error: null,
}

export class AuthStore extends SimpleStore<AuthState> {
  constructor() {
    super(initialAuthState)
  }

  setLoading(isLoading: boolean): void {
    this.setState(state => ({
      ...state,
      isLoading,
      error: isLoading ? null : state.error,
    }))
  }

  setAuthenticated(isAuthenticated: boolean, tokens: AuthTokens | null = null): void {
    this.setState(state => ({
      ...state,
      isAuthenticated,
      tokens,
      error: null,
    }))
  }

  setError(error: Error | null): void {
    this.setState(state => ({
      ...state,
      error,
      isLoading: false,
    }))
  }

  reset(): void {
    this.setState(initialAuthState)
  }
}

import { SimpleStore } from './simple-store'
import { TwoFactorMethod } from '../../domain/models/auth.models'

export interface TwoFactorState {
  isRequired: boolean
  availableMethods: TwoFactorMethod[]
  selectedMethod: TwoFactorMethod | null
  isLoading: boolean
  error: Error | null
  setupData: any | null
}

const initialTwoFactorState: TwoFactorState = {
  isRequired: false,
  availableMethods: [],
  selectedMethod: null,
  isLoading: false,
  error: null,
  setupData: null,
}

export class TwoFactorStore extends SimpleStore<TwoFactorState> {
  constructor() {
    super(initialTwoFactorState)
  }

  setLoading(isLoading: boolean): void {
    this.setState(state => ({
      ...state,
      isLoading,
      error: isLoading ? null : state.error,
    }))
  }

  setRequired(isRequired: boolean, methods: TwoFactorMethod[] = []): void {
    this.setState(state => ({
      ...state,
      isRequired,
      availableMethods: isRequired ? methods : [],
      selectedMethod: isRequired && methods.length > 0 ? methods[0] : null,
    }))
  }

  setSelectedMethod(method: TwoFactorMethod | null): void {
    this.setState(state => ({
      ...state,
      selectedMethod: method,
    }))
  }

  setSetupData(setupData: any | null): void {
    this.setState(state => ({
      ...state,
      setupData,
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
    this.setState(initialTwoFactorState)
  }
}

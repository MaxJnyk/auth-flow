import { Store, Subscriber } from './store.interface'

export class SimpleStore<T> implements Store<T> {
  private state: T
  private subscribers: Set<Subscriber<T>> = new Set()

  constructor(initialState: T) {
    this.state = initialState
  }

  getState(): T {
    return this.state
  }

  setState(newState: T | ((currentState: T) => T)): void {
    const nextState =
      typeof newState === 'function' ? (newState as (currentState: T) => T)(this.state) : newState

    if (this.hasStateChanged(this.state, nextState)) {
      this.state = nextState
      this.notifySubscribers()
    }
  }

  subscribe(subscriber: Subscriber<T>): () => void {
    this.subscribers.add(subscriber)
    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(this.state)
      } catch (error) {
        console.error('Error in store subscriber:', error)
      }
    })
  }

  private hasStateChanged(prevState: T, nextState: T): boolean {
    return JSON.stringify(prevState) !== JSON.stringify(nextState)
  }
}

export type Subscriber<T> = (state: T) => void

export interface Store<T> {
  getState(): T
  setState(newState: T | ((currentState: T) => T)): void
  subscribe(subscriber: Subscriber<T>): () => void
}

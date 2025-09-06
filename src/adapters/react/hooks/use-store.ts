import { useEffect, useState } from 'react'
import { Store } from '../../store/store.interface'

export function useStore<T>(store: Store<T>): T {
  const [state, setState] = useState<T>(store.getState())

  useEffect(() => {
    const unsubscribe = store.subscribe(newState => {
      setState(newState)
    })

    return () => {
      unsubscribe()
    }
  }, [store])

  return state
}

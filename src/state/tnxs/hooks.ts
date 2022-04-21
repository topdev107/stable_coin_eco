import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, AppState } from '../index'
import { addTnx } from './reducer'


export function useSwapState(): AppState['tnxs'] {
  return useSelector<AppState, AppState['tnxs']>((state) => state.tnxs)
}

export function useTnxHandler(): {
  saveTnx: (token_address: string, amount: string, timestamp: number) => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const saveTnx = useCallback(
    (token_address: string, amount: string, timestamp: number) => {
      dispatch(addTnx({ token_address, amount, timestamp }))
    },
    [dispatch]
  )

  return { saveTnx }
}

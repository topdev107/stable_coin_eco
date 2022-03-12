import { Currency, CurrencyAmount, ETHER, JSBI, Token, TokenAmount, Trade } from '@pantherswap-libs/sdk'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { AppDispatch, AppState } from '../index'

import { addTnx } from './reducer'
import { useUserSlippageTolerance } from '../user/hooks'
import { computeSlippageAdjustedAmounts } from '../../utils/prices'

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

import { createAction, createReducer } from '@reduxjs/toolkit'

type PoolItemList = Array<{ key1: string; token_address: string }>

export interface PoolItemState {
  poolItemList: PoolItemList
}

export const addOrUpdatePoolItem = createAction<{ key1: string; token_address: string }>('addOrUpdatePoolItem')

const initialState: PoolItemState = {
  poolItemList: []
}

export default createReducer(initialState, (builder) =>
  builder.addCase(addOrUpdatePoolItem, (state, action) => {
    const { key1, token_address } = action.payload

    if (state.poolItemList.length === 0 || state.poolItemList.findIndex((item) => item.key1.toLowerCase() === key1.toLowerCase()) === -1) {
      state.poolItemList.push({ key1, token_address })
    } else {      
      state.poolItemList.forEach((item) => {
        if (item.key1.toLowerCase() === key1.toLowerCase()) {
          item.token_address = token_address
        }
      })
    }
  })
)

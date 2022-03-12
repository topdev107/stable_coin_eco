import { createAction, createReducer } from '@reduxjs/toolkit'
import { StringifyOptions } from 'querystring'


type TnxsList = Array<{ token_address: string, amount: string, timestamp: number }>

export interface TnxsState {
  tnxs: TnxsList
}

export const addTnx = createAction<{ token_address: string, amount: string, timestamp: number }>('addTnx')

const initialState: TnxsState = {
  tnxs: []
}

export default createReducer(initialState, (builder) =>
  builder.addCase(addTnx, (state, action) => {
    const { token_address, amount, timestamp } = action.payload

    state.tnxs.push({token_address, amount, timestamp})
  })
)


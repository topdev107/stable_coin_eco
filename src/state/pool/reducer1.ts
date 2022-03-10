import { createAction, createReducer } from '@reduxjs/toolkit'

export const setTokenAddress = createAction<string>('setTokenAddress')

const initialState = ''

export default createReducer(initialState, (builder) =>
  builder.addCase(setTokenAddress, (state, action) => {
    state = action.payload    
  })
)

import { createSlice } from "@reduxjs/toolkit";
import type {PayloadAction} from '@reduxjs/toolkit'

export interface BalanceSheetState {
    value: number;
}


const initialState: BalanceSheetState ={
    value: 0
}


export const balanceSheetSlice = createSlice({
    name: 'balanceSheet',
    initialState,    
    reducers: {
        setBalanceSheetValue: (state, action: PayloadAction<number>) => {
            state.value = action.payload;
        }
    }
})
    


export const { setBalanceSheetValue } = balanceSheetSlice.actions;

export default balanceSheetSlice.reducer;
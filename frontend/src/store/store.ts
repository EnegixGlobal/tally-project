import { configureStore } from '@reduxjs/toolkit';
import { balanceSheetSlice } from './features/BalanceSheet/balancesheetSlice';
import allVoucherReducer from './features/AllVoucher/allVoucher';

export const store = configureStore({
  reducer: {
    balanceSheet: balanceSheetSlice.reducer,
    allVoucher: allVoucherReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { configureStore } from '@reduxjs/toolkit';
import { balanceSheetSlice } from './features/BalanceSheet/balancesheetSlice';

export const store = configureStore({
  reducer: {
    balanceSheet: balanceSheetSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

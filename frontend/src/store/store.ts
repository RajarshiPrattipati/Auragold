/**
 * Redux store configuration
 */
import { configureStore } from '@reduxjs/toolkit';
import stocksReducer from '@/features/stocks/stocksSlice';
import portfolioReducer from '@/features/portfolio/portfolioSlice';
import transactionsReducer from '@/features/transactions/transactionsSlice';
import userReducer from '@/features/user/userSlice';
import lmsReducer from '@/features/lms/lmsSlice';
import uiConfigReducer from '@/features/uiConfig/uiConfigSlice';

export const store = configureStore({
  reducer: {
    stocks: stocksReducer,
    portfolio: portfolioReducer,
    transactions: transactionsReducer,
    user: userReducer,
    lms: lmsReducer,
    uiConfig: uiConfigReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

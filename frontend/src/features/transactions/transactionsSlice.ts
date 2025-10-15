/**
 * Redux slice for transactions (buy/sell)
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';
import type { BuyTransactionRequest, SellTransactionRequest, TransactionResponse } from '@/types/api';

interface TransactionsState {
  loading: boolean;
  error: string | null;
  lastTransaction: TransactionResponse | null;
}

const initialState: TransactionsState = {
  loading: false,
  error: null,
  lastTransaction: null,
};

// Async thunks
export const buyStock = createAsyncThunk(
  'transactions/buyStock',
  async (request: BuyTransactionRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.buyStock(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to buy stock');
    }
  }
);

export const sellStock = createAsyncThunk(
  'transactions/sellStock',
  async (request: SellTransactionRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.sellStock(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to sell stock');
    }
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLastTransaction: (state) => {
      state.lastTransaction = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Buy stock
      .addCase(buyStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(buyStock.fulfilled, (state, action: PayloadAction<TransactionResponse>) => {
        state.loading = false;
        state.lastTransaction = action.payload;
      })
      .addCase(buyStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Sell stock
      .addCase(sellStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sellStock.fulfilled, (state, action: PayloadAction<TransactionResponse>) => {
        state.loading = false;
        state.lastTransaction = action.payload;
      })
      .addCase(sellStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearLastTransaction } = transactionsSlice.actions;
export default transactionsSlice.reducer;

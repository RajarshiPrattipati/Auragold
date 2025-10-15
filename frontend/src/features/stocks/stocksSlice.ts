/**
 * Redux slice for stocks management
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';
import type { Stock, StockListResponse } from '@/types/api';

interface StocksState {
  items: Stock[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: StocksState = {
  items: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchStocks = createAsyncThunk(
  'stocks/fetchStocks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getStocks();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch stocks');
    }
  }
);

const stocksSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStocks.fulfilled, (state, action: PayloadAction<StockListResponse>) => {
        state.loading = false;
        state.items = action.payload.stocks;
        state.lastUpdated = action.payload.last_updated;
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = stocksSlice.actions;
export default stocksSlice.reducer;

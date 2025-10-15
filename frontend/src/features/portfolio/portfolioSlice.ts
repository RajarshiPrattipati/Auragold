/**
 * Redux slice for portfolio management
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';
import type { PortfolioSummary } from '@/types/api';

interface PortfolioState {
  summary: PortfolioSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  summary: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchPortfolio = createAsyncThunk(
  'portfolio/fetchPortfolio',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.getPortfolio(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch portfolio');
    }
  }
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPortfolio: (state) => {
      state.summary = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action: PayloadAction<PortfolioSummary>) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearPortfolio } = portfolioSlice.actions;
export default portfolioSlice.reducer;

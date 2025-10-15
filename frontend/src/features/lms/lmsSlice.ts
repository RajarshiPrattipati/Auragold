/**
 * Redux slice for LMS (Layout Management System) configuration
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';
import type { LMSConfig } from '@/types/api';

interface LMSState {
  config: LMSConfig | null;
  loading: boolean;
  error: string | null;
}

const initialState: LMSState = {
  config: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchLMSConfig = createAsyncThunk(
  'lms/fetchConfig',
  async (_, { rejectWithValue }) => {
    try {
      // Check LocalStorage first
      const cachedConfig = localStorage.getItem('lms_config');
      if (cachedConfig) {
        return JSON.parse(cachedConfig) as LMSConfig;
      }

      // Fetch from API if not cached
      const response = await apiClient.getLMSConfig();

      // Cache in LocalStorage
      localStorage.setItem('lms_config', JSON.stringify(response));

      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch LMS config');
    }
  }
);

const lmsSlice = createSlice({
  name: 'lms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateConfig: (state, action: PayloadAction<LMSConfig>) => {
      state.config = action.payload;
      // Update LocalStorage
      localStorage.setItem('lms_config', JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLMSConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLMSConfig.fulfilled, (state, action: PayloadAction<LMSConfig>) => {
        state.loading = false;
        state.config = action.payload;
      })
      .addCase(fetchLMSConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateConfig } = lmsSlice.actions;
export default lmsSlice.reducer;

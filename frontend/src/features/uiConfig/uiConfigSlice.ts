import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/api'

export type LayoutState = {
  order: string[]
  visibility: Record<string, boolean>
}

export interface UIConfigState {
  // Arbitrary mapping of keys (e.g., 'dashboard_layout_v1') -> layout state
  layouts: Record<string, LayoutState>
  dirty: boolean
  lastSyncedAt: string | null
  error: string | null
}

const initialState: UIConfigState = {
  layouts: {},
  dirty: false,
  lastSyncedAt: null,
  error: null,
}

export const loadUserUIConfig = createAsyncThunk('uiConfig/load', async () => {
  const resp = await apiClient.getUserUIConfig()
  const cfg = (resp?.config || {}) as Record<string, any>
  return cfg
})

export const saveUserUIConfig = createAsyncThunk(
  'uiConfig/save',
  async (_, { getState }) => {
    const state = getState() as { uiConfig: UIConfigState }
    const payload = state.uiConfig.layouts
    const resp = await apiClient.saveUserUIConfig(payload)
    return resp
  }
)

const uiConfigSlice = createSlice({
  name: 'uiConfig',
  initialState,
  reducers: {
    updateLayout: (
      state,
      action: PayloadAction<{ key: string; layout: LayoutState }>
    ) => {
      state.layouts[action.payload.key] = action.payload.layout
      state.dirty = true
    },
    markClean: (state) => {
      state.dirty = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserUIConfig.fulfilled, (state, action) => {
        if (action.payload && typeof action.payload === 'object') {
          // Only load keys that look like layout states
          state.layouts = action.payload as Record<string, LayoutState>
        }
        state.error = null
      })
      .addCase(loadUserUIConfig.rejected, (state, action) => {
        state.error = (action.error?.message as string) || 'Failed to load UI config'
      })
      .addCase(saveUserUIConfig.fulfilled, (state) => {
        state.dirty = false
        state.lastSyncedAt = new Date().toISOString()
        state.error = null
      })
      .addCase(saveUserUIConfig.rejected, (state, action) => {
        state.error = (action.error?.message as string) || 'Failed to save UI config'
      })
  },
})

export const { updateLayout, markClean } = uiConfigSlice.actions
export default uiConfigSlice.reducer


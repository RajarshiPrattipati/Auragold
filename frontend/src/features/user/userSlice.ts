/**
 * Redux slice for user state management
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  id: number | null;
  name: string | null;
  balance: number;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  id: 1, // For demo purposes, default to user ID 1 (trader1)
  name: 'trader1',
  balance: 10000,
  isAuthenticated: true,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: number; name: string; balance: number }>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.balance = action.payload.balance;
      state.isAuthenticated = true;
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    logout: (state) => {
      state.id = null;
      state.name = null;
      state.balance = 0;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, updateBalance, logout } = userSlice.actions;
export default userSlice.reducer;

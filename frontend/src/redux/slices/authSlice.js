import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// Initialize user and token from localStorage if available
const storedUser = localStorage.getItem('user');
let parsedUser = null;
try {
  parsedUser = storedUser ? JSON.parse(storedUser) : null;
} catch {
  parsedUser = null;
}
const storedToken = localStorage.getItem('token');

const initialState = {
  user: parsedUser,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getMe();
      return response?.data || response;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch user profile';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.token) {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      } else {
        state.user = action.payload.user;
      }
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch Current User
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      const user =
        action.payload?.user ||
        action.payload?.data?.user ||
        action.payload;
      if (user && user._id) {
        state.user = user;
        localStorage.setItem('user', JSON.stringify(user));
      }
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.loading = false;
      const errStr = String(action.payload || '');
      if (
        errStr.includes('token') ||
        errStr.includes('Access denied') ||
        errStr.includes('deactivated') ||
        errStr.includes('401')
      ) {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      state.error = action.payload;
    });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

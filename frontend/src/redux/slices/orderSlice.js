import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import orderService from '../../services/orderService';

const initialState = {
  myOrders: [],
  allOrders: [],
  currentOrder: null,
  tracking: null,
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  },
  loading: false,
  error: null,
};

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await orderService.getMyOrders(params);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch your orders'
      );
    }
  }
);

export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAllOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await orderService.getAllOrders(params);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch orders'
      );
    }
  }
);

export const fetchOrderDetails = createAsyncThunk(
  'orders/fetchOrderDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(id);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch order details'
      );
    }
  }
);

export const fetchOrderTracking = createAsyncThunk(
  'orders/fetchOrderTracking',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderTracking(id);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch order tracking'
      );
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, statusData }, { rejectWithValue }) => {
    try {
      const response = await orderService.updateOrderStatus(id, statusData);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to update order status'
      );
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
      state.tracking = null;
    },
    clearOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchMyOrders
    builder.addCase(fetchMyOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMyOrders.fulfilled, (state, action) => {
      state.loading = false;
      state.myOrders = action.payload.orders || [];
      state.pagination = action.payload.pagination || state.pagination;
    });
    builder.addCase(fetchMyOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // fetchAllOrders
    builder.addCase(fetchAllOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAllOrders.fulfilled, (state, action) => {
      state.loading = false;
      state.allOrders = action.payload.orders || [];
      state.pagination = action.payload.pagination || state.pagination;
    });
    builder.addCase(fetchAllOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // fetchOrderDetails
    builder.addCase(fetchOrderDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOrderDetails.fulfilled, (state, action) => {
      state.loading = false;
      state.currentOrder = action.payload.order;
    });
    builder.addCase(fetchOrderDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // fetchOrderTracking
    builder.addCase(fetchOrderTracking.fulfilled, (state, action) => {
      state.tracking = action.payload;
    });

    // updateOrderStatus
    builder.addCase(updateOrderStatus.fulfilled, (state, action) => {
      state.currentOrder = action.payload.order;
      state.allOrders = state.allOrders.map((ord) =>
        ord._id === action.payload.order._id ? action.payload.order : ord
      );
    });
  },
});

export const { clearCurrentOrder, clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;

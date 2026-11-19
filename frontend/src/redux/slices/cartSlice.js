import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from '../../services/cartService';

const initialState = {
  cart: {
    items: [],
    totalItems: 0,
    subtotal: 0,
  },
  loading: false,
  error: null,
};

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartService.getCart();
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch cart'
      );
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const response = await cartService.addToCart(productId, quantity);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to add item to cart'
      );
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  'cart/updateCartQuantity',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await cartService.updateCartItem(productId, quantity);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to update item quantity'
      );
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await cartService.removeFromCart(productId);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to remove item from cart'
      );
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartService.clearCart();
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to clear cart'
      );
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart: (state) => {
      state.cart = { items: [], totalItems: 0, subtotal: 0 };
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handleFulfilled = (state, action) => {
      state.loading = false;
      const cartData = action.payload?.cart || action.payload;
      state.cart = cartData?.items
        ? cartData
        : { items: [], totalItems: 0, subtotal: 0 };
    };

    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, handleFulfilled)
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, handleFulfilled)
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateCartQuantity.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCartQuantity.fulfilled, handleFulfilled)
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFromCart.fulfilled, handleFulfilled)
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(clearCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearCart.fulfilled, handleFulfilled)
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;

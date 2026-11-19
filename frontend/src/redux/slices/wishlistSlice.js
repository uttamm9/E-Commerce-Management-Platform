import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import wishlistService from '../../services/wishlistService';

const initialState = {
  wishlist: {
    products: [],
  },
  loading: false,
  error: null,
};

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistService.getWishlist();
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch wishlist'
      );
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistService.addToWishlist(productId);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to add item to wishlist'
      );
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistService.removeFromWishlist(productId);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to remove item from wishlist'
      );
    }
  }
);

export const moveWishlistItemToCart = createAsyncThunk(
  'wishlist/moveWishlistItemToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const response = await wishlistService.moveToCart(productId, quantity);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to move item to cart'
      );
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    resetWishlist: (state) => {
      state.wishlist = { products: [] };
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handleFulfilled = (state, action) => {
      state.loading = false;
      const wishData = action.payload?.wishlist || action.payload;
      state.wishlist = wishData?.products
        ? wishData
        : { products: [] };
    };

    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, handleFulfilled)
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToWishlist.fulfilled, handleFulfilled)
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFromWishlist.fulfilled, handleFulfilled)
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(moveWishlistItemToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(moveWishlistItemToCart.fulfilled, handleFulfilled)
      .addCase(moveWishlistItemToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;

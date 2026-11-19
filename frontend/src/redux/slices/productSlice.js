import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';

const initialState = {
  products: [],
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 12,
  },
  currentProduct: null,
  categories: [],
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts(params);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch products'
      );
    }
  }
);

export const fetchProductDetails = createAsyncThunk(
  'products/fetchProductDetails',
  async (idOrSlug, { rejectWithValue }) => {
    try {
      const response = await productService.getProductById(idOrSlug);
      // Support both { success, data: { product } } and { product } or direct payload
      const payload = response?.data || response;
      return payload;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch product details'
      );
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (params, { rejectWithValue }) => {
    try {
      const response = await categoryService.getCategories(params);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch categories'
      );
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await productService.createProduct(formData);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to create product'
      );
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await productService.updateProduct(id, formData);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to update product'
      );
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await productService.deleteProduct(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to delete product'
      );
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearProductError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchProducts
    builder.addCase(fetchProducts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      state.loading = false;
      state.products = action.payload.products || [];
      state.pagination = action.payload.pagination || state.pagination;
    });
    builder.addCase(fetchProducts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // fetchProductDetails
    builder.addCase(fetchProductDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProductDetails.fulfilled, (state, action) => {
      state.loading = false;
      state.currentProduct =
        action.payload?.product ||
        action.payload?.data?.product ||
        action.payload;
    });
    builder.addCase(fetchProductDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // fetchCategories
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.categories = action.payload.categories || [];
    });

    // deleteProduct
    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      state.products = state.products.filter((p) => p._id !== action.payload);
    });
  },
});

export const { clearCurrentProduct, clearProductError } = productSlice.actions;
export default productSlice.reducer;

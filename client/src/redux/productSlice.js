import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../apiConfig';

const initialState = {
  products: [],
  categories: [],
  loading: false,
  error: null,
};

// Thunks
export const fetchProducts = createAsyncThunk('products/fetch', async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.isTrending) params.append('isTrending', 'true');
    if (filters.isBestSeller) params.append('isBestSeller', 'true');
    if (filters.isFeatured) params.append('isFeatured', 'true');
    if (filters.isNewArrival) params.append('isNewArrival', 'true');
    if (filters.limitedOffer) params.append('limitedOffer', 'true');
    
    const res = await axios.get(`${API_URL}/products?${params.toString()}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
  }
});

export const fetchCategories = createAsyncThunk('categories/fetch', async (_, thunkAPI) => {
  try {
    const res = await axios.get(`${API_URL}/categories`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to fetch categories');
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  }
});

export default productSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../apiConfig';

const initialState = {
  items: [], // [{ id, productId, product }]
  loading: false,
  error: null
};

const getHeaders = (getState) => {
  const token = getState().auth.token;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, { getState, rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_URL}/wishlist`, getHeaders(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load wishlist');
  }
});

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_URL}/wishlist/toggle`, { productId }, getHeaders(getState));
    return { productId, isAdded: res.data.isAdded, item: res.data.item };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to toggle wishlist');
  }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    resetWishlist: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
export const isProductInWishlist = (state, productId) => 
  state.wishlist.items.some(item => String(item.productId) === String(productId));

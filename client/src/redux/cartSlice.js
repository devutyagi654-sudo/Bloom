import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../apiConfig';

const initialState = {
  items: [], // [{ id, productId, quantity, product }]
  loading: false,
  error: null
};

const getHeaders = (getState) => {
  const token = getState().auth.token;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// Thunks
export const fetchCart = createAsyncThunk('cart/fetch', async (_, { getState, rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_URL}/cart`, getHeaders(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load cart');
  }
});

export const addToCart = createAsyncThunk('cart/add', async ({ productId, quantity }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_URL}/cart`, { productId, quantity }, getHeaders(getState));
    return res.data; // Note: returns raw cart row, we usually re-fetch cart to populate product details
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
  }
});

export const updateCartQuantity = createAsyncThunk('cart/update', async ({ cartItemId, quantity }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${API_URL}/cart/${cartItemId}`, { quantity }, getHeaders(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update quantity');
  }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (cartItemId, { getState, rejectWithValue }) => {
  try {
    await axios.delete(`${API_URL}/cart/${cartItemId}`, getHeaders(getState));
    return cartItemId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove item');
  }
});

export const clearCart = createAsyncThunk('cart/clear', async (_, { getState, rejectWithValue }) => {
  try {
    await axios.delete(`${API_URL}/cart`, getHeaders(getState));
    return [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add, update, remove are usually followed by dispatching fetchCart from the UI
      // to keep items fully populated and synced, but let's handle updates here where possible
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        const item = state.items.find(i => String(i.id) === String(action.payload.id));
        if (item) {
          item.quantity = action.payload.quantity;
        }
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter(i => String(i.id) !== String(action.payload));
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
      });
  }
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
export const selectCartTotal = (state) => 
  state.cart.items.reduce((total, item) => {
    const price = item.product.discountPrice || item.product.price;
    return total + price * item.quantity;
  }, 0);
export const selectCartCount = (state) => 
  state.cart.items.reduce((count, item) => count + item.quantity, 0);

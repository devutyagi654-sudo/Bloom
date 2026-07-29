import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartQuantity, removeFromCart, clearCart, selectCartTotal } from '../redux/cartSlice';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDirectPrice } from '../utils/currency';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.cart);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [isAuthenticated, dispatch]);

  const handleQtyChange = (cartItemId, currentQty, stock, increment) => {
    const newQty = increment ? currentQty + 1 : currentQty - 1;
    if (newQty < 1) return;
    if (newQty > stock) return;
    
    dispatch(updateCartQuantity({ cartItemId, quantity: newQty })).then(() => {
      dispatch(fetchCart());
    });
  };

  const handleRemove = (cartItemId) => {
    dispatch(removeFromCart(cartItemId)).then(() => {
      dispatch(fetchCart());
    });
  };

  const handleClear = () => {
    dispatch(clearCart()).then(() => {
      dispatch(fetchCart());
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] bg-[#F7E8DF]/40 dark:bg-[#1E130D]/40 text-[#4A3226] dark:text-[#F7E8DF] flex flex-col items-center justify-center text-center px-4">
        <ShoppingBag className="w-12 h-12 text-[#C98A63] mb-4 animate-bounce" />
        <h2 className="font-playfair text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-[#4A3226]/75 dark:text-[#F7E8DF]/65 text-sm max-w-sm mb-6">Please log in to view your shopping cart and place orders.</p>
        <Link to="/login" className="btn-luxury py-3.5 px-8 font-semibold text-xs tracking-widest uppercase transition-all duration-300">
          Log In
        </Link>
      </div>
    );
  }

  const subtotal = useSelector(selectCartTotal);
  const totalAmount = subtotal;

  // Image URL helper
  const getFullUrl = (path) => {
    if (!path) return '';
    let cleanPath = path;
    if (typeof path === 'string' && path.startsWith('"') && path.endsWith('"')) {
      try {
        cleanPath = JSON.parse(path);
      } catch (e) {
        // keep as is
      }
    }
    return cleanPath.startsWith('http') ? cleanPath : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-[#F7E8DF]/40 dark:bg-[#1E130D]/40 text-[#4A3226] dark:text-[#F7E8DF] transition-colors duration-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="font-playfair text-3xl md:text-4xl text-[#4A3226] dark:text-white font-bold tracking-wide mb-8 text-center sm:text-left">
          Shopping Cart
        </h1>

        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-[#C98A63] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 bg-[#F4DDD2]/20 dark:bg-[#241812]/40 rounded-2xl border border-dashed border-[#C98A63]/30 dark:border-[#C98A63]/25">
            <ShoppingBag className="w-12 h-12 text-[#C98A63] mx-auto mb-4" />
            <h3 className="font-playfair text-xl font-bold mb-2">Your Cart is Empty</h3>
            <p className="text-[#4A3226]/75 dark:text-[#F7E8DF]/65 text-sm max-w-sm mx-auto mb-6">
              You haven't added any luxury pieces to your cart yet. Explore our exquisite catalog.
            </p>
            <Link to="/shop" className="btn-luxury py-3.5 px-8 font-semibold text-xs tracking-widest uppercase transition-all duration-300 inline-block">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-[#C98A63]/20 dark:border-[#C98A63]/15">
                <span className="text-[#4A3226]/60 dark:text-[#F7E8DF]/50 text-xs font-bold uppercase tracking-widest">Atelier Item List</span>
                <button
                  onClick={handleClear}
                  className="text-xs text-red-500 hover:underline font-semibold flex items-center"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Cart
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {items.map((item) => {
                    const price = item.product.discountPrice || item.product.price;
                    let images = [];
                    if (item.product.images) {
                      if (typeof item.product.images === 'string') {
                        try {
                          images = JSON.parse(item.product.images);
                        } catch (e) {
                          images = [item.product.images];
                        }
                      } else if (Array.isArray(item.product.images)) {
                        images = item.product.images;
                      }
                    }
                    images = images.filter(Boolean);
                    const itemImage = images.length > 0 ? getFullUrl(images[0]) : '';
                    
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 card-luxury rounded-2xl gap-4 shadow-sm hover:shadow transition-shadow"
                      >
                        
                        {/* Image & name */}
                        <div className="flex items-center space-x-4">
                          <div className="w-20 aspect-[4/5] bg-neutral-200 dark:bg-neutral-900 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={itemImage} alt={item.product.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="font-playfair text-sm md:text-base font-bold text-[#4A3226] dark:text-[#F7E8DF] tracking-wide line-clamp-1">
                              <Link to={`/product/${item.productId}`}>{item.product.name}</Link>
                            </h3>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#4A3226]/50 dark:text-[#F7E8DF]/40 block mt-1">
                              Category: {item.product.category}
                            </span>
                            {item.selectedSize && (
                              <span className="text-xs font-bold text-[#C98A63] block mt-1">
                                Size: {item.selectedSize}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-[#4A3226]/80 dark:text-[#F7E8DF]/80 block mt-1">
                              {formatDirectPrice(price)} each
                            </span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-6 sm:space-x-8 border-t sm:border-t-0 border-[#C98A63]/10 dark:border-[#C98A63]/10 pt-3 sm:pt-0">
                          
                          {/* Qty Selector */}
                          <div className="flex border border-[#C98A63]/30 dark:border-[#C98A63]/20 bg-[#F4DDD2]/30 dark:bg-[#120a06]/40 rounded-xl overflow-hidden">
                            <button
                              onClick={() => handleQtyChange(item.id, item.quantity, item.product.stock, false)}
                              className="px-2.5 py-1 text-base font-bold hover:bg-neutral-150 dark:hover:bg-neutral-800 transition-colors"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 flex items-center font-bold text-xs w-8 justify-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQtyChange(item.id, item.quantity, item.product.stock, true)}
                              className="px-2.5 py-1 text-base font-bold hover:bg-neutral-150 dark:hover:bg-neutral-800 transition-colors"
                            >
                              +
                            </button>
                          </div>

                          {/* Subtotal */}
                          <span className="font-bold text-sm text-[#4A3226] dark:text-neutral-100 w-24 text-right">
                            {formatDirectPrice(price * item.quantity)}
                          </span>

                          {/* Trash button */}
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="p-2 text-[#4A3226]/60 dark:text-neutral-400 hover:text-red-500 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <div className="card-luxury p-6 sticky top-28 space-y-6">
                
                <h3 className="font-playfair text-lg font-bold text-[#4A3226] dark:text-white pb-4 border-b border-[#C98A63]/25 dark:border-[#C98A63]/15 tracking-wide">
                  Order Summary
                </h3>

                <div className="py-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#4A3226]/70 dark:text-[#F7E8DF]/60">Cart Subtotal</span>
                    <span className="font-semibold text-[#4A3226] dark:text-neutral-200">{formatDirectPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A3226]/70 dark:text-[#F7E8DF]/60">Delivery Charges</span>
                    <span className="font-semibold text-green-500">FREE</span>
                  </div>
                  <div className="bg-[#F4DDD2]/40 dark:bg-[#120a06]/40 p-2.5 rounded-xl text-[10px] text-[#4A3226]/70 dark:text-[#F7E8DF]/60 leading-relaxed border border-[#C98A63]/20 dark:border-[#C98A63]/15">
                    💡 Delivery is <strong>FREE</strong> for all prepaid orders worldwide.
                  </div>
                </div>

                <div className="border-t border-[#C98A63]/20 dark:border-[#C98A63]/15 py-4 flex justify-between font-bold text-base text-[#4A3226] dark:text-white">
                  <span>Grand Total</span>
                  <span className="text-[#C98A63]">{formatDirectPrice(totalAmount)}</span>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full flex items-center justify-center space-x-2 btn-luxury py-4 font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-lg mt-4"
                >
                  <span>Checkout Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Cart;

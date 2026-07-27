import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist } from '../redux/wishlistSlice';
import ProductCard from '../components/Product/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector((state) => state.wishlist);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [isAuthenticated, dispatch]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <Heart className="w-12 h-12 text-neutral-400 mb-4 animate-bounce" />
        <h2 className="font-playfair text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-neutral-500 text-sm max-w-sm mb-6">Please log in to view your luxury wishlist and save items.</p>
        <button onClick={() => navigate('/login')} className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest py-3.5 px-8 rounded">
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors duration-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="font-playfair text-3xl md:text-4xl text-neutral-900 dark:text-white font-bold tracking-wide mb-8 text-center sm:text-left">
          My Wishlist
        </h1>

        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-900">
            <Heart className="w-12 h-12 text-neutral-300 dark:text-neutral-800 mx-auto mb-4" />
            <h3 className="font-playfair text-xl font-bold mb-2">Your Wishlist is Empty</h3>
            <p className="text-neutral-400 text-sm max-w-sm mx-auto mb-6">
              Save your favorite luxury statement rings, watches, and hampers to watch their stock levels.
            </p>
            <button onClick={() => navigate('/shop')} className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest py-3.5 px-8 rounded hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
              Explore Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {items.map((item) => (
              <ProductCard key={item.id} product={item.product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Wishlist;

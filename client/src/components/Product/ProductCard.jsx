import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { toggleWishlist, fetchWishlist, isProductInWishlist } from '../../redux/wishlistSlice';
import { addToCart, fetchCart } from '../../redux/cartSlice';
import { motion } from 'framer-motion';
import { formatDirectPrice } from '../../utils/currency';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const inWishlist = useSelector((state) => isProductInWishlist(state, product.id));

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await dispatch(toggleWishlist(product.id));
    dispatch(fetchWishlist());
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (Number(product.stock) <= 0) return;

    await dispatch(addToCart({ productId: product.id, quantity: 1 }));
    dispatch(fetchCart());
  };

  const price = Number(product.price);
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
  const saving = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;

  // Use product images: handles array, or fallback string, or default luxury placeholder
  let imageUrl = 'https://images.unsplash.com/photo-1543294001-f7cbfe92237e?w=500&auto=format&fit=crop&q=80';
  if (product.images && product.images.length > 0) {
    imageUrl = product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`;
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative bg-[#F7E8DF]/60 dark:bg-[#241812]/70 border border-[#C98A63]/30 dark:border-[#C98A63]/25 rounded-2xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Product Image and badges */}
      <div className="relative aspect-[4/5] bg-[#F4DDD2]/20 dark:bg-[#1E130D]/20 overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>

        {/* Sale badge */}
        {discountPrice && (
          <span className="absolute top-4 left-4 z-10 bg-[#C98A63] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            -{saving}% SALE
          </span>
        )}

        {/* Out of Stock badge */}
        {Number(product.stock) <= 0 && (
          <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded">
              Out of stock
            </span>
          </div>
        )}

        {/* Product image with zoom effect */}
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-4 right-4 z-10 p-2.5 bg-[#F7E8DF]/80 dark:bg-[#241812]/80 backdrop-blur-md rounded-full shadow hover:bg-[#F7E8DF] dark:hover:bg-[#241812] border border-[#C98A63]/20 transition-colors"
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-600 text-red-600' : 'text-[#4A3226] dark:text-[#F7E8DF]'}`} />
        </button>

        {/* Add to Cart Overlay on hover */}
        {Number(product.stock) > 0 && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-center">
            <button
              onClick={handleAddToCart}
              className="flex items-center space-x-2 btn-luxury py-2.5 px-6 font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-lg"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          </div>
        )}
      </div>

      {/* Details info */}
      <div className="p-5 flex flex-col flex-grow">
        <span className="text-[#4A3226]/60 dark:text-[#F7E8DF]/50 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
          {product.category}
        </span>
        <h3 className="font-playfair text-base text-[#4A3226] dark:text-[#F7E8DF] font-semibold tracking-wide hover:text-[#C98A63] transition-colors line-clamp-1 mb-2">
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>

        {/* Ratings */}
        <div className="flex items-center space-x-1.5 mb-3.5">
          <div className="flex text-[#C98A63]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.round(product.ratings || 0) ? 'fill-[#C98A63]' : 'text-neutral-300 dark:text-neutral-700'
                  }`}
              />
            ))}
          </div>
          <span className="text-[#4A3226]/50 dark:text-[#F7E8DF]/40 text-[11px] font-semibold">({product.ratings || '0.0'})</span>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline space-x-2.5 mt-auto">
          {discountPrice ? (
            <>
              <span className="text-[#C98A63] dark:text-[#e59a72] font-semibold text-lg">
                {formatDirectPrice(discountPrice)}
              </span>
              <span className="text-[#4A3226]/50 dark:text-[#F7E8DF]/40 line-through text-sm font-medium">
                {formatDirectPrice(price)}
              </span>
            </>
          ) : (
            <span className="text-[#4A3226] dark:text-[#F7E8DF] font-semibold text-lg">
              {formatDirectPrice(price)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

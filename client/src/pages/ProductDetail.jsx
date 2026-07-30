import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { formatDirectPrice } from '../utils/currency';
import API_URL from '../apiConfig';
import ImageZoom from '../components/Product/ImageZoom';
import ReviewSection from '../components/Product/ReviewSection';
import ProductCard from '../components/Product/ProductCard';
import { toggleWishlist, fetchWishlist, isProductInWishlist } from '../redux/wishlistSlice';
import { addToCart, fetchCart } from '../redux/cartSlice';
import { Star, Heart, ShoppingCart, ShieldCheck, Gem, Sparkles, AlertCircle, Zap } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const inWishlist = useSelector((state) => isProductInWishlist(state, id));

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Related Products
  const [related, setRelated] = useState([]);
  
  // Quantity State & Size Selection State
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [cartSuccess, setCartSuccess] = useState('');

  const isBanglesCategory = (prod) => {
    if (!prod) return false;
    const cat = String(prod.category || '').toLowerCase().trim();
    return cat === 'bangles' || cat === 'bangle';
  };

  const fetchProductDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/products/${id}`);
      setProduct(res.data);
      setSelectedSize('');
      
      const relRes = await axios.get(`${API_URL}/products?category=${encodeURIComponent(res.data.category)}`);
      const filteredRelated = relRes.data.filter(p => String(p.id) !== String(res.data.id)).slice(0, 4);
      setRelated(filteredRelated);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
    window.scrollTo(0, 0);
  }, [id]);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await dispatch(toggleWishlist(id));
    dispatch(fetchWishlist());
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!product || Number(product.stock) <= 0) return;

    if (isBanglesCategory(product) && !selectedSize) {
      setCartSuccess('Please select a bangle size.');
      return;
    }
    
    setCartSuccess('');
    try {
      await dispatch(addToCart({ productId: id, quantity, selectedSize })).unwrap();
      dispatch(fetchCart());
      setCartSuccess('Added to cart successfully!');
      setTimeout(() => setCartSuccess(''), 3000);
    } catch (err) {
      setCartSuccess(err || 'Failed to add to cart');
    }
  };

  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!product || Number(product.stock) <= 0) return;

    if (isBanglesCategory(product) && !selectedSize) {
      setCartSuccess('Please select a bangle size.');
      return;
    }
    
    setCartSuccess('');
    setBuyNowLoading(true);
    try {
      await dispatch(addToCart({ productId: id, quantity, selectedSize })).unwrap();
      dispatch(fetchCart());
      navigate('/checkout');
    } catch (err) {
      setCartSuccess(err || 'Failed to process Buy Now');
      setBuyNowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
        <h2 className="font-playfair text-2xl font-bold mb-2">Error Loading Product</h2>
        <p className="text-neutral-500 text-sm max-w-sm mb-6">{error || 'The product you are looking for does not exist.'}</p>
        <Link to="/shop" className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest py-3.5 px-8 rounded">
          Back to Shop
        </Link>
      </div>
    );
  }

  const price = Number(product.price);
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
  const saving = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;
  
  let productImages = [];
  if (product.images) {
    if (typeof product.images === 'string') {
      try {
        productImages = JSON.parse(product.images);
      } catch (e) {
        productImages = [product.images];
      }
    } else if (Array.isArray(product.images)) {
      productImages = product.images;
    } else {
      productImages = [product.images];
    }
  }
  productImages = productImages.filter(Boolean);

  const isBangles = isBanglesCategory(product);

  return (
    <div className="bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors duration-300 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* Left: Images area */}
          <ImageZoom images={productImages} />

          {/* Right: details details */}
          <div className="space-y-6">
            
            {/* Category and Badges */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 dark:text-neutral-500 text-xs font-bold uppercase tracking-widest">
                {product.category}
              </span>
              <div className="flex space-x-2">
                {(product.isTrending === true || String(product.isTrending) === 'true') && (
                  <span className="bg-luxury-purple-50 text-luxury-purple-800 dark:bg-luxury-purple-950/40 dark:text-luxury-purple-300 text-[9px] font-bold tracking-widest px-2.5 py-1 rounded uppercase">
                    Trending
                  </span>
                )}
                {(product.limitedOffer === true || String(product.limitedOffer) === 'true') && (
                  <span className="bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[9px] font-bold tracking-widest px-2.5 py-1 rounded uppercase">
                    Limited
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="font-playfair text-3xl sm:text-4xl text-neutral-900 dark:text-white font-bold tracking-wide leading-tight">
              {product.name}
            </h1>

            {/* Star ratings */}
            <div className="flex items-center space-x-3">
              <div className="flex text-luxury-gold-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.ratings || 0) ? 'fill-luxury-gold-500' : 'text-neutral-300 dark:text-neutral-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-neutral-500">{product.ratings || '0.0'} / 5.0 Rating</span>
              <span className="text-neutral-300 dark:text-neutral-800">|</span>
              <span className="text-xs text-neutral-400 font-medium">({product.reviews ? product.reviews.length : 0} reviews)</span>
            </div>

            {/* Price display */}
            <div className="flex items-baseline space-x-4 border-t border-b border-neutral-100 dark:border-neutral-900 py-4">
              {discountPrice ? (
                <>
                  <span className="text-2xl font-bold text-luxury-gold-600 dark:text-luxury-gold-400">
                    {formatDirectPrice(discountPrice)}
                  </span>
                  <span className="text-neutral-400 dark:text-neutral-600 line-through text-base font-semibold">
                    {formatDirectPrice(price)}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-500">
                    Save {saving}%
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {formatDirectPrice(price)}
                </span>
              )}
            </div>

            {/* Stock status indicator */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-semibold text-neutral-500">Availability:</span>
              {Number(product.stock) > 0 ? (
                <span className="text-green-500 font-bold flex items-center">
                  In Stock ({product.stock} units available)
                </span>
              ) : (
                <span className="text-red-500 font-bold flex items-center">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm font-light text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {product.description || 'This beautifully designed luxury piece encapsulates the pure minimalism and sophisticated styling characteristics of bloomluxecollection. Handcrafted from top-grade metals and precious gems.'}
            </p>

            {/* Size selection section for Bangles */}
            {isBangles && (
              <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-800 dark:text-neutral-200">
                    Select Size <span className="text-red-500">*</span>
                  </label>
                  {selectedSize ? (
                    <span className="text-xs font-bold text-luxury-gold-600 dark:text-luxury-gold-400 uppercase tracking-wider">
                      Size: {selectedSize}
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                      Required
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {['2.2', '2.4', '2.6', '2.8'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setCartSuccess('');
                      }}
                      className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all duration-200 ${
                        selectedSize === size
                          ? 'bg-luxury-gold-500 text-black border-luxury-gold-500 shadow-md font-extrabold scale-105'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-luxury-gold-500/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trust highlights banner */}
            <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-100 dark:border-neutral-900 grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center space-y-1">
                <ShieldCheck className="w-5 h-5 text-luxury-gold-500" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-600 dark:text-neutral-400">GIA Certified</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <Gem className="w-5 h-5 text-luxury-gold-500" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-600 dark:text-neutral-400">18K Solid Gold</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <Sparkles className="w-5 h-5 text-luxury-gold-500" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-600 dark:text-neutral-400">Secured Box</span>
              </div>
            </div>

            {/* Add to cart / quantity selector / wishlist / Buy Now controls */}
            {Number(product.stock) > 0 && (
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-2.5 sm:gap-x-3 gap-y-2.5 sm:gap-y-3 items-center pt-2">
                
                {/* Row 1, Col 1: Quantity selection */}
                <div className="flex border border-neutral-300 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden h-12 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 sm:px-3.5 py-2 text-lg font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-800 dark:text-neutral-200"
                  >
                    -
                  </button>
                  <span className="px-2 sm:px-3 flex items-center font-bold text-sm min-w-9 justify-center text-neutral-800 dark:text-neutral-200">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(Number(product.stock), q + 1))}
                    className="px-3 sm:px-3.5 py-2 text-lg font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-800 dark:text-neutral-200"
                  >
                    +
                  </button>
                </div>

                {/* Row 1, Col 2: Add to Cart button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="h-12 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 hover:from-luxury-gold-500 hover:to-luxury-gold-400 text-black font-bold text-xs tracking-widest uppercase rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Add to Cart</span>
                </button>

                {/* Row 1, Col 3: Wishlist toggle button */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className="w-12 sm:w-[56px] h-12 flex-shrink-0 flex items-center justify-center border border-neutral-300 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300 shadow-xs"
                  title="Add to Wishlist"
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? 'fill-red-600 text-red-600' : ''}`} />
                </button>

                {/* Row 2, Col 1: Empty spacer matching Quantity selector column */}
                <div></div>

                {/* Row 2, Col 2: BUY NOW Button (Exact same grid column, width, height, font & radius as ADD TO CART) */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={buyNowLoading}
                  className="h-12 w-full flex items-center justify-center space-x-2 bg-black hover:bg-neutral-900 text-white dark:bg-neutral-900 dark:hover:bg-black font-bold text-xs tracking-widest uppercase rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-black/10 dark:border-neutral-800 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 flex-shrink-0 text-luxury-gold-400" />
                  <span className="truncate">{buyNowLoading ? 'Processing...' : 'BUY NOW'}</span>
                </button>

                {/* Row 2, Col 3: Empty spacer matching Wishlist icon column */}
                <div></div>

              </div>
            )}

            {cartSuccess && (
              <p className={`text-sm font-semibold mt-2 ${
                cartSuccess.includes('successfully') ? 'text-green-500' : 'text-red-500'
              }`}>
                {cartSuccess}
              </p>
            )}

          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-neutral-100 dark:border-neutral-900 mt-20 pt-16 max-w-4xl">
          <ReviewSection
            productId={id}
            reviews={product.reviews}
            onReviewAdded={(updatedProduct) => setProduct(updatedProduct)}
          />
        </div>

        {/* Related Products catalog */}
        {related.length > 0 && (
          <div className="border-t border-neutral-100 dark:border-neutral-900 mt-20 pt-16">
            <h3 className="font-playfair text-2xl font-bold tracking-wide text-neutral-900 dark:text-white mb-10 text-center">
              You May Also Exquisite
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetail;

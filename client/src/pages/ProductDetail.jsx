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
import { Star, Heart, ShoppingCart, ShieldCheck, Gem, Sparkles, AlertCircle, Zap, Award, Package, Truck, CheckSquare, RotateCcw, Lock } from 'lucide-react';

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
              {product.description || 'This beautifully designed fashion jewellery piece encapsulates the modern aesthetics and style of bloomluxecollection. Crafted with skin-friendly materials and durable finishes for everyday wear.'}
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

            {/* Delivery & Live Social Proof Banner */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                <Truck className="w-4.5 h-4.5 text-neutral-700 dark:text-neutral-300 flex-shrink-0 stroke-[2]" />
                <span>Fast Delivery within 2-3 days</span>
              </div>
              
              <div className="inline-flex items-center space-x-2 bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-teal-700 dark:text-teal-400 px-3.5 py-1.5 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                <span><strong className="font-bold">45 people</strong> are checking out right now</span>
              </div>
            </div>

            {/* Add to cart / quantity selector / wishlist / Buy Now controls */}
            {Number(product.stock) > 0 && (
              <div className="space-y-3 pt-2">
                
                {/* Quantity + Add to Cart + Wishlist Row */}
                <div className="flex items-center space-x-2.5 sm:space-x-3">
                  
                  {/* Quantity selection */}
                  <div className="flex border-2 border-black dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden h-12 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3 py-2 text-lg font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-800 dark:text-neutral-200"
                    >
                      -
                    </button>
                    <span className="px-2.5 flex items-center font-bold text-sm min-w-[32px] justify-center text-neutral-800 dark:text-neutral-200">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.min(Number(product.stock), q + 1))}
                      className="px-3 py-2 text-lg font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-800 dark:text-neutral-200"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="h-12 flex-1 flex items-center justify-center space-x-2 border-2 border-black dark:border-white bg-white dark:bg-black hover:bg-neutral-100 dark:hover:bg-neutral-900 text-black dark:text-white font-extrabold text-xs tracking-widest uppercase rounded-xl transition-all duration-200"
                  >
                    <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Add to cart</span>
                  </button>

                  {/* Wishlist toggle button */}
                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center border-2 border-black/20 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300 shadow-xs"
                    title="Add to Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${inWishlist ? 'fill-red-600 text-red-600' : ''}`} />
                  </button>

                </div>

                {/* BUY NOW Button with Embedded Payment Badges & Shiprocket Branding */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={buyNowLoading}
                  className="w-full h-14 bg-black hover:bg-neutral-900 text-white dark:bg-neutral-900 dark:hover:bg-black font-extrabold text-sm tracking-widest uppercase rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-black/10 dark:border-neutral-800 disabled:opacity-50 flex items-center justify-between px-5 relative overflow-hidden group"
                >
                  <div className="flex items-center space-x-3 mx-auto sm:mx-0">
                    <span>{buyNowLoading ? 'Processing...' : 'BUY NOW'}</span>
                    
                    {/* Embedded Payment Icons (GPay, PhonePe, Paytm) */}
                    <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-xs py-1 px-2.5 rounded-full border border-white/20">
                      {/* Google Pay */}
                      <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-0.5 shadow-xs" title="Google Pay">
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                          <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1C3.26 21.3 7.31 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.98-3.1z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.98 3.1c.95-2.85 3.6-4.96 6.73-4.96z"/>
                        </svg>
                      </span>

                      {/* PhonePe */}
                      <span className="w-5 h-5 bg-[#5f259f] rounded-full flex items-center justify-center text-white font-bold text-[9px] shadow-xs" title="PhonePe">
                        पे
                      </span>

                      {/* Paytm */}
                      <span className="w-5 h-5 bg-[#002e6e] rounded-full flex items-center justify-center text-[#00baf2] font-black text-[7px] shadow-xs tracking-tighter" title="Paytm">
                        paytm
                      </span>
                    </div>
                  </div>

                  {/* Powered By Shiprocket Branding */}
                  <span className="hidden sm:flex items-center text-[9px] text-white/50 font-medium space-x-1">
                    <span>Powered By</span>
                    <span className="font-bold text-white/80">Shiprocket</span>
                  </span>
                </button>

              </div>
            )}

            {cartSuccess && (
              <p className={`text-sm font-semibold mt-2 ${
                cartSuccess.includes('successfully') ? 'text-green-500' : 'text-red-500'
              }`}>
                {cartSuccess}
              </p>
            )}

            {/* 3 Trust Features Grid Below BUY NOW (Exact replica of screenshot) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-900 text-center">
              
              {/* 1. Partial COD Available */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-900 space-y-2">
                <div className="w-9 h-9 rounded-lg border-2 border-neutral-900 dark:border-neutral-100 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-neutral-900 dark:text-white stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-extrabold text-neutral-900 dark:text-white leading-tight">
                  Partial COD Available
                </span>
              </div>

              {/* 2. 7 days return policy */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-900 space-y-2">
                <div className="w-9 h-9 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-neutral-900 dark:text-white stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-extrabold text-neutral-900 dark:text-white leading-tight">
                  7 days return policy
                </span>
              </div>

              {/* 3. Secure payments */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-900 space-y-2">
                <div className="w-9 h-9 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-neutral-900 dark:text-white stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-extrabold text-neutral-900 dark:text-white leading-tight">
                  Secure payments
                </span>
              </div>

            </div>

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

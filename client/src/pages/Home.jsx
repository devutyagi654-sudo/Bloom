import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { fetchProducts, fetchCategories } from '../redux/productSlice';
import HeroSlider from '../components/Home/HeroSlider';
import CategoriesMenu from '../components/Home/CategoriesMenu';
import ProductCard from '../components/Product/ProductCard';
import FAQ from '../components/Home/FAQ';
import { motion } from 'framer-motion';
import { Star, Mail, ArrowRight, ShieldCheck, Gem, Sparkles } from 'lucide-react';
import axios from 'axios';
import API_URL from '../apiConfig';

const ReviewCard = ({ rev }) => {
  const initials = rev.userName ? rev.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <div className="w-[300px] sm:w-[350px] flex-shrink-0 card-luxury p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        {rev.userImage ? (
          <img
            src={rev.userImage}
            alt={rev.userName}
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-[#C98A63]/30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#A86E4A] via-[#C98A63] to-[#F2CDBD] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {initials}
          </div>
        )}
        <div className="text-left">
          <h5 className="font-playfair font-bold text-[#4A3226] dark:text-[#F7E8DF] text-sm tracking-wide">
            {rev.userName}
          </h5>
          <span className="text-[10px] text-[#4A3226]/50 dark:text-[#F7E8DF]/40">
            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </span>
        </div>
      </div>

      <div className="flex text-[#C98A63]">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={`w-3.5 h-3.5 ${idx < Number(rev.rating) ? 'fill-[#C98A63] text-[#C98A63]' : 'text-neutral-200 dark:text-neutral-800'
              }`}
          />
        ))}
      </div>

      <p className="text-[#4A3226]/80 dark:text-[#F7E8DF]/70 text-xs sm:text-sm leading-relaxed italic line-clamp-4 text-left font-light">
        "{rev.comment}"
      </p>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { products, categories, loading } = useSelector((state) => state.products);

  // States for newsletter
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ type: '', msg: '' });
  const [newsLoading, setNewsLoading] = useState(false);

  // Active banners list state
  const [activeBanners, setActiveBanners] = useState([]);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());

    // Fetch custom banners list
    axios.get(`${API_URL}/banner`)
      .then(res => {
        setActiveBanners(res.data || []);
      })
      .catch(err => console.error('Failed to load custom banners', err));
  }, [dispatch]);

  // Aggregate all unique verified reviews from loaded products database
  const allReviews = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    const list = [];
    products.forEach(product => {
      if (product.reviews && Array.isArray(product.reviews)) {
        product.reviews.forEach(review => {
          if (review && review.comment && review.comment.trim() && review.userName) {
            list.push({
              ...review,
              productName: product.name,
              productId: product.id
            });
          }
        });
      }
    });

    // Deduplicate duplicate/spam reviews (same commenter with same comment text)
    const seen = new Set();
    const uniqueList = [];

    list.forEach(review => {
      const signature = `${review.userId || review.userName}-${review.comment.trim().toLowerCase()}`;
      if (!seen.has(signature)) {
        seen.add(signature);
        uniqueList.push(review);
      }
    });

    // Sort by date (newest first)
    return uniqueList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [products]);

  // Duplicate display list enough times so the marquee flows seamlessly
  const displayReviews = useMemo(() => {
    if (allReviews.length === 0) return [];

    let list = [...allReviews];
    while (list.length < 8) {
      list = [...list, ...allReviews];
    }
    return list;
  }, [allReviews]);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setNewsLoading(true);
    setNewsletterStatus({ type: '', msg: '' });

    try {
      await axios.post(`${API_URL}/contact/newsletter`, { email: newsletterEmail });
      setNewsletterStatus({ type: 'success', msg: 'Welcome to the bloomluxecollection Club. Please check your inbox shortly.' });
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterStatus({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to subscribe. Please try again later.'
      });
    } finally {
      setNewsLoading(false);
    }
  };

  // Filter collections
  const trendingProducts = products.filter(p => p.isTrending === true || String(p.isTrending) === 'true').slice(0, 4);
  const bestSellers = products.filter(p => p.isBestSeller === true || String(p.isBestSeller) === 'true').slice(0, 4);
  const newArrivals = products.filter(p => p.isNewArrival === true || String(p.isNewArrival) === 'true').slice(0, 4);

  return (
    <div className="bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors duration-300">

      {/* Hero Banner Carousel */}
      <HeroSlider customBanners={activeBanners} />

      {/* Categories Section */}
      <CategoriesMenu categories={categories} />

      {/* Trending Collections Section */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-950/40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-luxury-gold-600 dark:text-luxury-gold-400 font-bold uppercase tracking-widest text-xs flex items-center">
                <Sparkles className="w-4 h-4 mr-1 text-luxury-gold-500 animate-spin" /> High Demand
              </span>
              <h2 className="font-playfair text-3xl md:text-4xl text-neutral-900 dark:text-white font-bold tracking-wide mt-2">
                Trending Jewels
              </h2>
            </div>
            <Link to="/shop" className="text-luxury-gold-600 dark:text-luxury-gold-400 hover:text-black dark:hover:text-white font-semibold text-sm tracking-widest uppercase flex items-center mt-4 md:mt-0 transition-colors">
              View Catalog <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-neutral-200 dark:bg-neutral-900 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Featured Banner Callout */}
      <section className="relative py-24 bg-gradient-to-r from-luxury-purple-950 via-neutral-900 to-black overflow-hidden select-none">

        {/* Subtle blur highlights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-luxury-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-luxury-gold-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">

          <div className="max-w-xl space-y-6">
            <span className="text-luxury-gold-400 font-bold uppercase tracking-widest text-xs flex items-center">
              <Gem className="w-4 h-4 mr-1.5" /> Signature Craftsmanship
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl text-white font-bold leading-tight">
              A Symphony of Metals & Certitude
            </h2>
            <p className="text-neutral-400 font-light text-sm sm:text-base leading-relaxed">
              Every diamond at bloomluxecollection is individually inspected and sourced conflict-free. Certified GIA certificates accompany every ring, ensuring purity, longevity, and high investment metrics for our global collectors.
            </p>
            <div className="flex items-center space-x-6 text-neutral-300 text-xs tracking-wider uppercase font-semibold">
              <div className="flex items-center">
                <ShieldCheck className="w-4 h-4 text-luxury-gold-500 mr-2" />
                <span>GIA Certified</span>
              </div>
              <div className="flex items-center">
                <ShieldCheck className="w-4 h-4 text-luxury-gold-500 mr-2" />
                <span>18K White Gold</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex justify-center">
            <div className="relative group max-w-sm rounded-xl overflow-hidden shadow-2xl border border-white/5">
              <img
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80"
                alt="Luxury Pendant Closeup"
                className="w-[320px] aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </div>

        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">
            <span className="text-luxury-gold-600 dark:text-luxury-gold-400 font-bold uppercase tracking-widest text-xs">
              Atelier Favorites
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl text-neutral-900 dark:text-white font-bold tracking-wide mt-2">
              Our Best Sellers
            </h2>
            <div className="w-16 h-0.5 bg-luxury-gold-500 mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-20 bg-neutral-50 dark:bg-neutral-950/20 border-t border-neutral-100 dark:border-neutral-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">

          <div className="text-center mb-16">
            <span className="text-luxury-gold-600 dark:text-luxury-gold-400 font-bold uppercase tracking-widest text-xs">
              Client Testimonials
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl text-neutral-900 dark:text-white font-bold tracking-wide mt-2">
              Customer Reviews
            </h2>
            <div className="w-16 h-0.5 bg-luxury-gold-500 mx-auto mt-4"></div>
          </div>

          {allReviews.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-900 rounded-2xl max-w-xl mx-auto shadow-sm px-8 py-10">
              <p className="text-neutral-500 dark:text-neutral-400 text-sm italic">
                "No customer reviews yet. Be the first to share your experience!"
              </p>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden py-4">
              {/* Fade masks for visual premium feeling */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-neutral-50 dark:from-neutral-950/20 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-neutral-50 dark:from-neutral-950/20 to-transparent z-10 pointer-events-none" />

              <style>{`
                @keyframes scrollLeftToRight {
                  0% {
                    transform: translateX(-50%);
                  }
                  100% {
                    transform: translateX(0);
                  }
                }
                .reviews-marquee {
                  display: flex;
                  width: max-content;
                  animation: scrollLeftToRight 45s linear infinite;
                }
                .reviews-marquee:hover {
                  animation-play-state: paused;
                }
              `}</style>

              <div className="flex">
                <div className="reviews-marquee space-x-6 pr-6">
                  {/* First copy */}
                  {displayReviews.map((rev, idx) => (
                    <ReviewCard key={`r1-${idx}`} rev={rev} />
                  ))}
                  {/* Second copy for infinite scrolling loop */}
                  {displayReviews.map((rev, idx) => (
                    <ReviewCard key={`r2-${idx}`} rev={rev} />
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* Newsletter Subscription Section */}
      <section className="py-20 bg-gradient-to-r from-[#241812] via-[#1e130d] to-[#120a06] select-none relative overflow-hidden">

        {/* Abstract design elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#C98A63]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <Mail className="w-10 h-10 mx-auto text-[#C98A63] animate-bounce" />
          <h2 className="font-playfair text-3xl sm:text-4xl text-white font-bold tracking-wide">
            Join the Bloom Luxe Club
          </h2>
          <p className="text-[#F7E8DF]/80 font-light text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Subscribe to receive private previews, custom catalogue offerings, and invitations to exclusive collections and store openings.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-stretch justify-center max-w-md mx-auto pt-4 gap-2 sm:gap-0">
            <input
              type="email"
              placeholder="Enter your email address"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="px-5 py-3.5 text-sm input-luxury w-full placeholder-[#4A3226]/50 dark:placeholder-[#F7E8DF]/40 rounded-full sm:rounded-r-none sm:rounded-l-full focus:ring-[#C98A63] focus:border-[#C98A63]"
            />
            <button
              type="submit"
              disabled={newsLoading}
              className="btn-luxury py-3.5 px-8 rounded-full sm:rounded-l-none sm:rounded-r-full font-semibold text-xs tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
            >
              {newsLoading ? 'Joining...' : 'Subscribe'}
            </button>
          </form>

          {newsletterStatus.msg && (
            <p className={`text-xs mt-3 font-semibold ${newsletterStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
              {newsletterStatus.msg}
            </p>
          )}

        </div>
      </section>

    </div>
  );
};

export default Home;

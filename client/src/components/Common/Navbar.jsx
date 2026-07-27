import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Heart, ShoppingCart, User, LogOut, LayoutDashboard, Menu, X, Mic, MapPin } from 'lucide-react';
import { logoutUser } from '../../redux/authSlice';
import { fetchCart, selectCartCount } from '../../redux/cartSlice';
import { fetchWishlist } from '../../redux/wishlistSlice';
import DarkModeToggle from './DarkModeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_URL from '../../apiConfig';
import blcLogo from '../../assets/blc-logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const cartCount = useSelector(selectCartCount);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Mobile/Tablet search overlay



  // Fetch dynamic categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await axios.get(`${API_URL}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories', err);
        // Fallback
        setCategories([
          { id: '1', name: 'Rings' },
          { id: '2', name: 'Hamper' },
          { id: '3', name: 'Watches' }
        ]);
      }
    };
    fetchCats();
  }, []);

  // Fetch cart & wishlist on mount / auth change
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [isAuthenticated, dispatch]);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
    setIsSearchOpen(false);
  }, [location]);

  // Scroll listener for sticky header shadow styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please try Google Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => {
      setIsListening(true);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      navigate(`/shop?search=${encodeURIComponent(transcript)}`);
      setIsSearchOpen(false);
    };
    recognition.start();
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  const isLinkActive = (path, catName = '') => {
    if (path === '/') {
      return location.pathname === '/' && !location.search;
    }
    if (path.startsWith('/shop') && catName) {
      const queryParams = new URLSearchParams(location.search);
      const categoryQuery = queryParams.get('category');
      return location.pathname === '/shop' && categoryQuery && categoryQuery.toLowerCase() === catName.toLowerCase();
    }
    return location.pathname === path;
  };

  return (
    <>
      <nav className={`w-full h-20 border-b transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#F7E8DF]/90 dark:bg-[#1E130D]/90 backdrop-blur-md shadow-sm border-[#C98A63]/20' 
          : 'bg-transparent border-transparent'
      }`}>
        <div className="max-w-[95%] sm:max-w-[92%] mx-auto h-full px-2 sm:px-4">

          {/* 3-Column Grid Layout to prevent overlaps and keep logo centered */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 h-full items-center">

            {/* Left Column (col-span-1): Hamburger Menu & Category Links */}
            <div className="flex items-center justify-start space-x-2 sm:space-x-4 h-full">
              {/* Hamburger Icon (Always visible) */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-[#4A3226] dark:text-[#F7E8DF] hover:text-[#C98A63] dark:hover:text-[#C98A63] transition-all duration-305 hover:scale-110 focus:outline-none"
                title="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Navigation links (Desktop only - hidden on mobile/tablet) */}
              <div className="hidden lg:flex items-center space-x-5 xl:space-x-7 h-full flex-nowrap whitespace-nowrap">
                <Link
                  to="/"
                  className={`relative h-full flex items-center font-playfair text-base tracking-wider capitalize font-medium transition-colors px-1 ${
                    isLinkActive('/') 
                      ? 'text-[#4A3226] dark:text-white font-bold' 
                      : 'text-[#4A3226]/80 dark:text-[#F7E8DF]/80 hover:text-[#C98A63] dark:hover:text-[#C98A63]'
                  }`}
                >
                  <span>Home</span>
                  {isLinkActive('/') && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#C98A63]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>

                {categories.map((cat) => {
                  const isActive = isLinkActive('/shop', cat.name);
                  return (
                    <Link
                      key={cat.id || cat.name}
                      to={`/shop?category=${encodeURIComponent(cat.name)}`}
                      className={`relative h-full flex items-center font-playfair text-base tracking-wider capitalize font-medium transition-colors px-1 ${
                        isActive 
                          ? 'text-[#4A3226] dark:text-white font-bold' 
                          : 'text-[#4A3226]/80 dark:text-[#F7E8DF]/80 hover:text-[#C98A63] dark:hover:text-[#C98A63]'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#C98A63]"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Center Column (col-span-1): Perfectly Centered Logo */}
            <div className="flex items-center justify-center">
              <Link
                to="/"
                className="flex items-center justify-center transition-all duration-300 hover:scale-105 hover:brightness-110"
              >
                <img
                  src={blcLogo}
                  alt="BLC Brand Logo"
                  className="h-10 sm:h-[48px] md:h-[55px] lg:h-[60px] w-auto object-contain"
                />
              </Link>
            </div>

            {/* Right Column (col-span-1): Search & Icons */}
            <div className="flex items-center justify-end space-x-1.5 sm:space-x-3">
              {/* Search Bar (Desktop only - hidden on mobile/tablet) */}
              <div className="hidden lg:block">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center w-36 xl:w-56 focus-within:w-44 xl:focus-within:w-64 transition-all duration-300">
                  <input
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-[10px] xl:text-[11px] py-2 pl-4 pr-14 bg-[#F4DDD2]/40 dark:bg-[#120a06]/40 border border-[#C98A63]/30 dark:border-[#C98A63]/25 rounded-full focus:outline-none focus:ring-1 focus:ring-[#C98A63] focus:border-[#C98A63] focus:bg-[#F4DDD2]/60 transition-all duration-300 font-medium text-[#4A3226] dark:text-[#F7E8DF] placeholder-[#4A3226]/50 dark:placeholder-[#F7E8DF]/45"
                  />
                  <div className="absolute right-3 flex items-center space-x-1.5 text-[#C98A63]">
                    <button
                      type="button"
                      onClick={handleVoiceSearch}
                      className={`p-0.5 hover:text-[#A86E4A] transition-colors ${isListening ? 'text-red-500 animate-pulse' : ''
                        }`}
                      title="Voice Search"
                    >
                      <Mic className="w-3 h-3 xl:w-3.5 xl:h-3.5" />
                    </button>
                    <button
                      type="submit"
                      className="p-0.5 hover:text-[#A86E4A] transition-colors"
                      title="Search"
                    >
                      <Search className="w-3 h-3 xl:w-3.5 xl:h-3.5" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Action Icons List */}
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {/* Search Toggle Icon (Tablet/Mobile only - hidden on desktop) */}
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="lg:hidden p-2 text-neutral-700 dark:text-neutral-300 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-all duration-300 hover:scale-110 focus:outline-none"
                  title="Search"
                >
                  <Search className="w-4.5 h-4.5" />
                </button>

                {/* Location Icon (Desktop only - hidden on tablet/mobile) */}
                <button
                  onClick={() => setIsStoreModalOpen(true)}
                  className="hidden lg:inline-flex p-2 text-neutral-700 dark:text-neutral-300 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-all duration-300 hover:scale-110 focus:outline-none"
                  title="Store Locator"
                >
                  <MapPin className="w-4.5 h-4.5 xl:w-5 xl:h-5" />
                </button>

                {/* Account / User Dropdown Toggler (Desktop/Tablet only - hidden on mobile) */}
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="p-2 text-neutral-700 dark:text-neutral-300 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-all duration-300 hover:scale-110 focus:outline-none"
                    title="Account"
                  >
                    <User className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </button>

                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2.5 w-60 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-3 shadow-xl z-50 text-xs text-left"
                      >
                        {isAuthenticated ? (
                          <>
                            <div className="px-4 pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                              <p className="font-bold text-neutral-800 dark:text-neutral-150 truncate">{user?.fullName}</p>
                              <p className="text-[10px] text-neutral-450 dark:text-neutral-500 truncate">{user?.email}</p>
                            </div>
                            {user?.role?.toUpperCase() === 'ADMIN' && (
                              <Link
                                to="/admin"
                                className="flex items-center px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-colors font-semibold text-neutral-700 dark:text-neutral-300"
                              >
                                <LayoutDashboard className="w-4 h-4 mr-2.5" />
                                Admin Dashboard
                              </Link>
                            )}
                            <Link
                              to="/orders"
                              className="flex items-center px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-colors font-semibold text-neutral-700 dark:text-neutral-300"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2.5" />
                              My Orders
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full text-left px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-red-600 font-semibold transition-colors"
                            >
                              <LogOut className="w-4 h-4 mr-2.5" />
                              Logout
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/login"
                              className="block px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-colors font-semibold text-neutral-700 dark:text-neutral-300"
                            >
                              Login
                            </Link>
                            <Link
                              to="/register"
                              className="block px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-colors font-semibold text-neutral-700 dark:text-neutral-300"
                            >
                              Register
                            </Link>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Wishlist Link (Desktop/Tablet only - hidden on mobile) */}
                <Link
                  to="/wishlist"
                  className="hidden md:inline-flex p-2 text-neutral-700 dark:text-neutral-300 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-all duration-300 hover:scale-110 relative"
                  title="Wishlist"
                >
                  <Heart className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  {isAuthenticated && wishlistItems.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-650 text-white rounded-full text-[9px] w-3.5 h-3.5 flex items-center justify-center font-bold">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>

                {/* Cart Link (Always visible on mobile/tablet/desktop) */}
                <Link
                  to="/cart"
                  className="p-2 text-neutral-700 dark:text-neutral-300 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-all duration-300 hover:scale-110 relative"
                  title="Cart"
                >
                  <ShoppingCart className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  {isAuthenticated && cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-[9px] w-3.5 h-3.5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Dark Mode Toggle (Desktop/Tablet only - hidden on mobile navbar, visible in drawer instead) */}
                <div className="hidden md:block pl-1">
                  <DarkModeToggle />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile/Tablet Search Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-950 border-b border-neutral-200/80 dark:border-neutral-800 p-4 shadow-md z-40 lg:hidden"
            >
              <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs py-2.5 pl-4 pr-16 bg-[#fafafa] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-neutral-800 dark:text-neutral-200"
                />
                <div className="absolute right-3.5 flex items-center space-x-2 text-neutral-400">
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    className={`p-1 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-colors ${isListening ? 'text-red-500 animate-pulse' : ''
                      }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                  <button type="submit" className="p-1 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-colors">
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Drawer (gliding from left) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-110 bg-black/50 backdrop-blur-xs"
            />

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl z-120 flex flex-col justify-between"
            >
              {/* Header inside drawer */}
              <div className="p-6 space-y-6 flex-grow overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
                    <img
                      src={blcLogo}
                      alt="BLC Brand Logo"
                      className="h-10 w-auto object-contain"
                    />
                  </Link>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-neutral-400 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 transition-colors focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search in Drawer (Mobile search layout) */}
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search boutique collections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs py-2.5 pl-4 pr-16 bg-[#fafafa] dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-full focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all font-medium text-neutral-800 dark:text-neutral-200"
                  />
                  <div className="absolute right-3 flex items-center space-x-1.5 text-neutral-400 dark:text-neutral-500">
                    <button
                      type="button"
                      onClick={handleVoiceSearch}
                      className={`p-1 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400 ${isListening ? 'text-red-500 animate-pulse' : ''}`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button type="submit" className="p-1 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                {/* Navigation Links inside Drawer (Home, categories, profile account, wishlist, contact, about) */}
                <div className="flex flex-col space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-left">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-xs font-bold uppercase tracking-widest py-1 transition-colors ${isLinkActive('/') ? 'text-[#ff0000]' : 'text-neutral-800 dark:text-neutral-200 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400'
                      }`}
                  >
                    Home
                  </Link>

                  {/* All Categories Section */}
                  <div className="space-y-2.5 pl-3 border-l border-neutral-250 dark:border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Categories</span>
                    {categories.map((cat) => {
                      const isActive = isLinkActive('/shop', cat.name);
                      return (
                        <Link
                          key={cat.id || cat.name}
                          to={`/shop?category=${encodeURIComponent(cat.name)}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block text-xs font-semibold py-0.5 transition-colors ${isActive ? 'text-[#ff0000]' : 'text-neutral-600 dark:text-neutral-400 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400'
                            }`}
                        >
                          {cat.name}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Login / My Account Section */}
                  <div className="space-y-2.5 pl-3 border-l border-neutral-250 dark:border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Login & Account</span>
                    {isAuthenticated ? (
                      <>
                        <div className="py-0.5">
                          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-250 truncate">{user?.fullName}</p>
                          <p className="text-[10px] text-neutral-500 truncate">{user?.email}</p>
                        </div>
                        {user?.role?.toUpperCase() === 'ADMIN' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-luxury-gold-600"
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        <Link
                          to="/orders"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-luxury-gold-600"
                        >
                          My Orders
                        </Link>
                      </>
                    ) : (
                      <Link
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-luxury-gold-600"
                      >
                        Login / Register
                      </Link>
                    )}
                  </div>

                  {/* Wishlist Link inside Drawer */}
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xs font-bold uppercase tracking-widest py-1 flex items-center justify-between text-neutral-800 dark:text-neutral-200 hover:text-luxury-gold-600 dark:hover:text-luxury-gold-400"
                  >
                    <span>Wishlist</span>
                    {wishlistItems.length > 0 && (
                      <span className="bg-red-650 text-white rounded-full text-[9px] px-2 py-0.5 font-bold">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>

                  {/* Information Links */}
                  <div className="space-y-2.5 pl-3 border-l border-neutral-250 dark:border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Atelier Information</span>
                    <Link
                      to="/contact"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-luxury-gold-600"
                    >
                      Contact Us
                    </Link>
                    <Link
                      to="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-luxury-gold-600"
                    >
                      About Us
                    </Link>
                  </div>

                  {/* Logout Button */}
                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center text-left py-2.5 text-red-600 font-bold uppercase tracking-widest text-xs hover:underline border-t border-neutral-105 dark:border-neutral-800 mt-3"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Footer (contains DarkMode toggle for mobile viewports) */}
              <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/60">
                <span className="text-xs text-neutral-500 font-medium">Appearance theme</span>
                <DarkModeToggle />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Store Locator Modal */}
      <AnimatePresence>
        {isStoreModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-130 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsStoreModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 rounded-2xl max-w-lg w-full shadow-2xl space-y-6 relative text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsStoreModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black dark:hover:text-white transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 text-luxury-gold-600 dark:text-luxury-gold-400">
                <h3 className="font-playfair text-2xl font-bold tracking-wide">bloomluxecollection Showroom Locator</h3>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed uppercase tracking-wider font-semibold">
                Visit our luxury showrooms to explore conflict-free solitaire collections and custom design suites.
              </p>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border-t border-neutral-100 dark:border-neutral-900 pt-4">
                <div className="border-b border-neutral-100 dark:border-neutral-900 pb-3">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">Mumbai Showroom</span>
                  <p className="text-xs text-neutral-500 mt-1">Colaba Causeway, Apollo Bandar, Colaba, Mumbai, MH 400001</p>
                  <p className="text-[10px] text-neutral-455 mt-0.5">📞 +91 22 4589 1200 • Mon - Sun: 11 AM - 8 PM</p>
                </div>
                <div className="border-b border-neutral-100 dark:border-neutral-900 pb-3">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">New Delhi Boutique</span>
                  <p className="text-xs text-neutral-500 mt-1">Radial Road 1, Connaught Place, New Delhi, DL 110001</p>
                  <p className="text-[10px] text-neutral-455 mt-0.5">📞 +91 11 3985 4300 • Mon - Sun: 11 AM - 8:30 PM</p>
                </div>
                <div className="border-b border-neutral-100 dark:border-neutral-900 pb-3">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">Bengaluru Atelier</span>
                  <p className="text-xs text-neutral-500 mt-1">100 Feet Rd, Hal 2nd Stage, Indiranagar, Bengaluru, KA 560038</p>
                  <p className="text-[10px] text-neutral-455 mt-0.5">📞 +91 80 2956 7800 • Tue - Sun: 10:30 AM - 7:30 PM</p>
                </div>
                <div className="border-b border-neutral-100 dark:border-neutral-900 pb-3">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">London Mayfair</span>
                  <p className="text-xs text-neutral-500 mt-1">12 Bond Street, Mayfair, London, W1S 4PP, UK</p>
                  <p className="text-[10px] text-neutral-455 mt-0.5">📞 +44 20 7946 0192 • Mon - Sat: 10 AM - 6 PM</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">New York Fifth Ave</span>
                  <p className="text-xs text-neutral-500 mt-1">712 Fifth Avenue, Manhattan, New York, NY 10019, USA</p>
                  <p className="text-[10px] text-neutral-455 mt-0.5">📞 +1 212 555 0148 • Mon - Sat: 10 AM - 7 PM</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

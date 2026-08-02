import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const HeroSlider = ({ customBanners }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const getFullUrl = (path) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${path}`;
  };

  // Compile active slides using only custom banners uploaded via Admin Panel
  const slides = (customBanners && Array.isArray(customBanners) && customBanners.length > 0)
    ? customBanners.map((cb, idx) => ({
        image: getFullUrl(cb.bannerPath),
        title: idx === 0 ? 'Curated Luxury Collection' : idx === 1 ? 'Fine Jewellery Atelier' : idx === 2 ? 'Signature Timepieces' : idx === 3 ? 'Exquisite Bangles & Accessories' : 'Heritage Masterworks',
        subtitle: idx === 0 ? 'Exclusive Campaign' : idx === 1 ? 'Pure Elegance' : idx === 2 ? 'Heritage & Precision' : idx === 3 ? 'Fashion Jewellery' : 'Modern Luxury',
        description: 'Explore our masterfully designed custom collections crafted just for you.',
        cta: 'Shop Collection',
        link: '/shop'
      }))
    : [];

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return null; // Hide the slider completely if no banners are uploaded
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-[80vh] min-h-[500px] w-full overflow-hidden bg-neutral-950">

      {/* Slides Carousel Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Readability gradient overlay matching the premium theme */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/75 z-10" />

          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="w-full h-full object-cover object-center brightness-95 contrast-[1.02]"
            loading="lazy"
          />

          {/* Slide Text Content & CTA Alignment */}
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-xl md:max-w-2xl space-y-6 text-left">

                <motion.span
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-luxury-gold-400 font-bold uppercase tracking-widest text-xs md:text-sm block"
                >
                  {slides[currentSlide].subtitle}
                </motion.span>

                <motion.h1
                  initial={{ y: 25, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.6 }}
                  className="font-playfair text-4xl sm:text-5xl md:text-6xl text-white font-bold tracking-wide leading-tight"
                >
                  {slides[currentSlide].title}
                </motion.h1>

                <motion.p
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-neutral-300 font-light text-sm sm:text-base md:text-lg leading-relaxed"
                >
                  {slides[currentSlide].description}
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="pt-4"
                >
                  <button
                    onClick={() => navigate(slides[currentSlide].link)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 hover:from-luxury-gold-500 hover:to-luxury-gold-400 text-black py-3.5 px-8 rounded font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>{slides[currentSlide].cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>

              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 border border-white/10 rounded-full text-white bg-black/25 backdrop-blur-xs hover:bg-white hover:text-black transition-all duration-300 hover:scale-110 hidden sm:block focus:outline-none"
        title="Previous Slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 border border-white/10 rounded-full text-white bg-black/25 backdrop-blur-xs hover:bg-white hover:text-black transition-all duration-300 hover:scale-110 hidden sm:block focus:outline-none"
        title="Next Slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-35 flex space-x-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1.5 transition-all duration-300 rounded-full ${currentSlide === i ? 'w-8 bg-luxury-gold-500' : 'w-2 bg-white/40'
              }`}
            title={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

    </div>
  );
};

export default HeroSlider;

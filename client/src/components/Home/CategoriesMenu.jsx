import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CategoriesMenu = ({ categories = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="py-16 bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-12">
          <span className="text-luxury-gold-600 dark:text-luxury-gold-400 font-bold uppercase tracking-widest text-xs">
            Exquisite Selection
          </span>
          <h2 className="font-playfair text-3xl md:text-4xl text-neutral-900 dark:text-white font-bold tracking-wide mt-2">
            Shop by Category
          </h2>
          <div className="w-16 h-0.5 bg-luxury-gold-500 mx-auto mt-4"></div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id || i}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
              className="group cursor-pointer bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
            >
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Thin overlay */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
              </div>
              
              {/* Name Details */}
              <div className="p-4 text-center mt-auto">
                <h3 className="font-playfair text-base font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-luxury-gold-500 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-1 font-light">
                  {cat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default CategoriesMenu;

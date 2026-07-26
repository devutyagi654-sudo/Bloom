import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const DarkModeToggle = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark'); // Default to dark for luxury feel

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
      title="Toggle Dark Mode"
    >
      <motion.div
        key={theme}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-luxury-gold-400" /> : <Moon className="w-5 h-5" />}
      </motion.div>
    </button>
  );
};

export default DarkModeToggle;

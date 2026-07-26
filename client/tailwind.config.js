/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        luxury: {
          gold: {
            50: '#F7E8DF', // Champagne
            100: '#F4DDD2', // Blush Beige
            200: '#F2CDBD', // Soft Peach
            300: '#e8bba2',
            400: '#db9b78',
            500: '#C98A63', // Rose Gold
            600: '#b87952',
            700: '#A86E4A', // Luxury Bronze
            800: '#8a5332',
            900: '#4A3226', // Dark Brown Text
            950: '#241812', // Deep Chocolate Brown
          },
          purple: {
            50: '#f8f4ff',
            100: '#f2e8ff',
            200: '#e5d4ff',
            300: '#d0b3ff',
            400: '#b486ff',
            500: '#9b56ff',
            600: '#8b2eff',
            700: '#791bee',
            800: '#6714cc',
            900: '#5410a3',
            950: '#1a033b',
          },
        }
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '16px',
        '3xl': '18px',
      },
      fontFamily: {
        playfair: ['"Cormorant Garamond"', '"Playfair Display"', 'serif'],
        jakarta: ['"Poppins"', '"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'premium-gradient': 'linear-gradient(135deg, #241812 0%, #1e130d 50%, #120a06 100%)', // Rich Chocolate Warm Background
        'gold-gradient': 'linear-gradient(135deg, #A86E4A 0%, #C98A63 50%, #F2CDBD 100%)', // Rose Gold Silk Gradient
        'silk-gradient': 'linear-gradient(135deg, #F7E8DF 0%, #F4DDD2 50%, #F2CDBD 100%)', // Silk Background Gradient
      },
    },
  },
  plugins: [],
}

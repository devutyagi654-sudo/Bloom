require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const migrateToPersistent = require('./scratch/migrate_to_persistent');
migrateToPersistent();

const { initDB, getTableData, writeTableData, insertRow } = require('./config/db');
const { EXCHANGE_RATE } = require('./config/currency');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded static files
const usePersistent = fs.existsSync('/data');
const uploadsStaticDir = usePersistent ? '/data/uploads' : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsStaticDir));

// Routes Hookup
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/banner', require('./routes/bannerRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/shipping', require('./routes/shippingRoutes'));
app.use('/api/webhook', require('./routes/webhookRoutes'));

// Seed Database if empty
function seedDatabase() {
  try {
    const categories = getTableData('categories.xlsx');
    const products = getTableData('products.xlsx');
    
    // Seed Categories
    if (categories.length === 0) {
      const defaultCategories = [
        {
          id: '1',
          name: 'Bangles',
          description: 'Sleek luxury gold, silver and traditional bridal bangles.',
          image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Earrings',
          description: 'Timeless diamond solitaires, gold studs, and elegant drops.',
          image: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Rings',
          description: 'Engagement bands, luxury solitaires, and custom rings.',
          image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Hamper',
          description: 'Premium curated luxury hampers and customized gift sets.',
          image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Watches',
          description: 'Premium statement timepieces and chronographs.',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString()
        }
      ];
      writeTableData('categories.xlsx', defaultCategories);
      console.log('Seeded categories database.');
    }
    
    // Seed Products
    if (products.length === 0) {
      const defaultProducts = [
        {
          id: '1',
          name: 'Aura Diamond Solitaire Ring',
          description: 'A classic 18k white gold band featuring an exquisite 1.5 carat round brilliant diamond with maximum brilliance. Perfect for proposals and lifelong memories.',
          price: 2499,
          discountPrice: 1999,
          category: 'Rings',
          stock: 12,
          images: [
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1543294001-f7cbfe92237e?w=600&auto=format&fit=crop&q=80'
          ],
          isTrending: true,
          isBestSeller: true,
          isFeatured: true,
          isNewArrival: false,
          limitedOffer: true,
          ratings: 0.0,
          reviews: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Heavy Kashmiri Ghungroo Bangles',
          description: 'Exquisitely handcrafted traditional bangles with micro-etched patterns and delicate silver bells (ghungroos) that chime softly with movement. Plated in premium 22k gold.',
          price: 999,
          discountPrice: 550,
          category: 'Bangles',
          stock: 24,
          images: [
            'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80'
          ],
          isTrending: true,
          isBestSeller: false,
          isFeatured: true,
          isNewArrival: true,
          limitedOffer: false,
          ratings: 0.0,
          reviews: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Cascade Emerald Drop Earrings',
          description: 'A striking pair of dangle earrings featuring pear-cut Colombian emeralds framed by brilliant micro-pave diamonds, set in 18k yellow gold.',
          price: 1599,
          discountPrice: 1399,
          category: 'Earrings',
          stock: 8,
          images: [
            'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600&auto=format&fit=crop&q=80'
          ],
          isTrending: false,
          isBestSeller: true,
          isFeatured: true,
          isNewArrival: true,
          limitedOffer: true,
          ratings: 0.0,
          reviews: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Infinity Gold Pendant Necklace',
          description: 'An elegant minimalist infinity-shaped gold wire frame adorned with micro-diamonds, hanging from a delicate 18k solid gold chain. Adjustable length.',
          price: 890,
          discountPrice: 750,
          category: 'Hamper',
          stock: 15,
          images: [
            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&auto=format&fit=crop&q=80'
          ],
          isTrending: true,
          isBestSeller: false,
          isFeatured: false,
          isNewArrival: true,
          limitedOffer: false,
          ratings: 0.0,
          reviews: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Grand Chrono Leather Watch',
          description: 'Sophisticated luxury watch featuring a genuine alligator leather strap, sapphire crystal glass, and a sleek black chronograph dial with gold-accented hour markers.',
          price: 1850,
          discountPrice: 1490,
          category: 'Watches',
          stock: 6,
          images: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop&q=80'
          ],
          isTrending: false,
          isBestSeller: true,
          isFeatured: false,
          isNewArrival: false,
          limitedOffer: true,
          ratings: 0.0,
          reviews: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '6',
          name: 'Matcha Jhumka & Bangle Box',
          description: 'A matching custom jewelry set containing matching micro-enameled pastel green Jhumka earrings and traditional silk thread bangles. Packed in a velvet storage box.',
          price: 699,
          discountPrice: 499,
          category: 'Bangles',
          stock: 30,
          images: [
            'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80'
          ],
          isTrending: true,
          isBestSeller: false,
          isFeatured: true,
          isNewArrival: true,
          limitedOffer: false,
          ratings: 0.0,
          reviews: [],
          createdAt: new Date().toISOString()
        }
      ];
      // Convert seed prices from USD to INR
      const defaultProductsConverted = defaultProducts.map(p => ({
        ...p,
        price: Math.round(Number(p.price) * EXCHANGE_RATE),
        discountPrice: p.discountPrice ? Math.round(Number(p.discountPrice) * EXCHANGE_RATE) : null
      }));
      writeTableData('products.xlsx', defaultProductsConverted);
      console.log('Seeded products database (in INR).');
    }

    // Seed Admin User
    const users = getTableData('users.xlsx');
    const adminExists = users.some(u => String(u.email).toLowerCase() === 'admin@blc.com');
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('admin9090', salt);
      insertRow('users.xlsx', {
        fullName: 'Atelier Admin',
        email: 'admin@blc.com',
        mobile: '9999999999',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Seeded admin user in database.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}



// Migration: Convert existing products in products.xlsx from USD to INR if needed
function migrateUSDToINR() {
  try {
    const products = getTableData('products.xlsx');
    let needsMigration = false;
    
    const migrated = products.map(prod => {
      // If price is stored in USD (e.g. < 5000), let's convert it to INR.
      if (Number(prod.price) < 5000) {
        prod.price = Math.round(Number(prod.price) * EXCHANGE_RATE);
        if (prod.discountPrice) {
          prod.discountPrice = Math.round(Number(prod.discountPrice) * EXCHANGE_RATE);
        }
        needsMigration = true;
      }
      return prod;
    });

    if (needsMigration) {
      writeTableData('products.xlsx', migrated);
      console.log(`Successfully migrated database prices to INR using exchange rate: 1 USD = ₹${EXCHANGE_RATE}`);
    }
  } catch (err) {
    console.error('Error during currency migration:', err);
  }
}

// One-time database migration: Rename category "Necklaces" to "Hamper", rename "Bangles" to "Bracelet", & standardize/deduplicate categories
function migrateCategories() {
  try {
    const categories = getTableData('categories.xlsx');
    let catUpdated = false;

    // Standardize category names
    categories.forEach(c => {
      if (c.name) {
        const nameTrimmed = String(c.name).trim();
        if (nameTrimmed.toLowerCase() === 'necklaces') {
          c.name = 'Hamper';
          c.description = 'Premium curated luxury hampers and customized gift sets.';
          catUpdated = true;
        } else if (nameTrimmed.toLowerCase() === 'bangles' || nameTrimmed.toLowerCase() === 'bracelet' || nameTrimmed.toLowerCase() === 'bracelets') {
          c.name = 'Bracelet';
          c.description = 'Elegant handcrafted bracelets, cuffs, and wristwear.';
          catUpdated = true;
        } else if (nameTrimmed.toLowerCase() === 'rings' && c.name !== 'Rings') {
          c.name = 'Rings';
          catUpdated = true;
        } else if (nameTrimmed.toLowerCase() === 'earrings' && c.name !== 'Earrings') {
          c.name = 'Earrings';
          catUpdated = true;
        } else if (nameTrimmed.toLowerCase() === 'hamper' && c.name !== 'Hamper') {
          c.name = 'Hamper';
          catUpdated = true;
        } else if (nameTrimmed.toLowerCase() === 'watches' && c.name !== 'Watches') {
          c.name = 'Watches';
          catUpdated = true;
        }
      }
    });

    // Deduplicate categories
    const seen = new Set();
    const uniqueCategories = [];
    categories.forEach(c => {
      const lowerName = String(c.name).toLowerCase().trim();
      if (!seen.has(lowerName)) {
        seen.add(lowerName);
        uniqueCategories.push(c);
      } else {
        catUpdated = true;
      }
    });

    if (catUpdated) {
      writeTableData('categories.xlsx', uniqueCategories);
      console.log(`[MIGRATION] Standardized and deduplicated categories. Total unique categories: ${uniqueCategories.length}.`);
    }

    const products = getTableData('products.xlsx');
    let prodUpdated = false;
    products.forEach(p => {
      if (p.category) {
        const catClean = String(p.category).trim();
        if (catClean.toLowerCase() === 'necklaces') {
          p.category = 'Hamper';
          prodUpdated = true;
        } else if (catClean.toLowerCase() === 'bangles' || catClean.toLowerCase() === 'bracelet' || catClean.toLowerCase() === 'bracelets') {
          p.category = 'Bracelet';
          prodUpdated = true;
        } else if (catClean.toLowerCase() === 'rings' && p.category !== 'Rings') {
          p.category = 'Rings';
          prodUpdated = true;
        } else if (catClean.toLowerCase() === 'earrings' && p.category !== 'Earrings') {
          p.category = 'Earrings';
          prodUpdated = true;
        } else if (catClean.toLowerCase() === 'hamper' && p.category !== 'Hamper') {
          p.category = 'Hamper';
          prodUpdated = true;
        } else if (catClean.toLowerCase() === 'watches' && p.category !== 'Watches') {
          p.category = 'Watches';
          prodUpdated = true;
        }
      }
    });

    if (prodUpdated) {
      writeTableData('products.xlsx', products);
      console.log('[MIGRATION] Standardized product categories casing and bracelet renames in database.');
    }
  } catch (err) {
    console.error('[MIGRATION] Category and product migration failed:', err);
  }
}

const PORT = process.env.PORT || 5000;
const { startProgressionService } = require('./services/progressionService');

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to BLC Premium Ecommerce API!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Boot Database first, then launch Web Server
initDB().then(() => {
  seedDatabase();
  migrateUSDToINR();
  migrateCategories();
  
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    startProgressionService();
  });
}).catch(err => {
  console.error('[SERVER] Fatal database initialization failure:', err);
  process.exit(1);
});

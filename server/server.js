require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const { connectDB } = require('./config/db');
const { startProgressionService } = require('./services/progressionService');

const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');

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
async function seedDatabase() {
  try {
    const categoryCount = await Category.countDocuments();
    const productCount = await Product.countDocuments();
    const userCount = await User.countDocuments();

    // Ensure Bangles category exists and migration for existing DB records
    await Category.findOneAndUpdate(
      { name: { $regex: /^bangles$/i } },
      {
        $setOnInsert: {
          name: 'Bangles',
          description: 'Handcrafted traditional and modern gold & silver bangles.',
          image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&auto=format&fit=crop&q=80'
        }
      },
      { upsert: true, new: true }
    );
    await Category.findOneAndUpdate(
      { name: { $regex: /^bracelets?$/i } },
      {
        $setOnInsert: {
          name: 'Bracelets',
          description: 'Sleek fashion gold and silver finish bracelets.',
          image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80'
        }
      },
      { upsert: true, new: true }
    );

    // Migration: Update existing products whose name contains "bangle" to category "Bangles"
    await Product.updateMany(
      { name: { $regex: /bangle/i }, category: { $regex: /^bracelets?$/i } },
      { $set: { category: 'Bangles' } }
    );
    // Migration: Update existing products whose name contains "bracelet" to category "Bracelets"
    await Product.updateMany(
      { name: { $regex: /bracelet/i }, category: { $regex: /^bangles?$/i } },
      { $set: { category: 'Bracelets' } }
    );

    // Seed Categories
    if (categoryCount === 0) {
      const defaultCategories = [
        {
          name: 'Bangles',
          description: 'Handcrafted traditional and modern gold & silver bangles.',
          image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&auto=format&fit=crop&q=80'
        },
        {
          name: 'Bracelets',
          description: 'Sleek fashion gold and silver finish bracelets.',
          image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80'
        },
        {
          name: 'Earrings',
          description: 'Timeless solitaire studs, hoop earrings, and elegant drops.',
          image: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600&auto=format&fit=crop&q=80'
        },
        {
          name: 'Rings',
          description: 'Statement bands, solitaire rings, and fashion rings.',
          image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80'
        },
        {
          name: 'Hamper',
          description: 'Premium curated luxury hampers and customized gift sets.',
          image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'
        },
        {
          name: 'Watches',
          description: 'Premium statement timepieces and chronographs.',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
        }
      ];
      await Category.insertMany(defaultCategories);
      console.log('[SEED] Seeded categories into MongoDB Atlas.');
    }

    // Seed Products
    if (productCount === 0) {
      const defaultProducts = [
        {
          name: 'Aura Crystal Solitaire Ring',
          description: 'A classic polished band featuring an exquisite solitaire crystal with maximum brilliance.',
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
          reviews: []
        },
        {
          name: 'Heavy Kashmiri Ghungroo Bangles',
          description: 'Exquisitely handcrafted traditional bangles with micro-etched patterns and delicate silver-toned bells (ghungroos). Gold finish.',
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
          reviews: []
        },
        {
          name: 'Cascade Emerald Drop Earrings',
          description: 'A striking pair of dangle earrings featuring pear-cut emerald-toned stones framed by brilliant micro-pave crystals.',
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
          reviews: []
        },
        {
          name: 'Infinity Gold-Toned Pendant Necklace',
          description: 'An elegant minimalist infinity-shaped wire frame adorned with micro-crystals, hanging from a delicate chain.',
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
          reviews: []
        },
        {
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
          reviews: []
        },
        {
          name: 'Matcha Jhumka & Bangle Box',
          description: 'A matching custom jewelry set containing matching micro-enameled pastel green Jhumka earrings and traditional silk thread bangles.',
          price: 699,
          discountPrice: 499,
          category: 'Bracelet',
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
          reviews: []
        }
      ];
      await Product.insertMany(defaultProducts);
      console.log('[SEED] Seeded default products into MongoDB Atlas.');
    }

    // Seed Admin User
    const adminUser = await User.findOne({ email: 'admin@blc.com' });
    if (!adminUser) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('admin9090', salt);
      await User.create({
        fullName: 'Atelier Admin',
        email: 'admin@blc.com',
        mobile: '9999999999',
        password: hashedPassword,
        role: 'ADMIN'
      });
      console.log('[SEED] Seeded admin user in MongoDB Atlas.');
    }
  } catch (error) {
    console.error('[SEED] Error seeding database:', error);
  }
}

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to BLC Premium Ecommerce API (MongoDB Atlas)' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas first, then seed and launch Express Server
connectDB()
  .then(async () => {
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log("===================================");
      console.log("RAZORPAY CONFIG CHECK:");
      console.log("KEY_ID:", process.env.RAZORPAY_KEY_ID || 'MISSING');
      console.log("SECRET FOUND:", !!process.env.RAZORPAY_KEY_SECRET);
      console.log("-----------------------------------");
      console.log("SHIPROCKET CONFIG CHECK:");
      console.log("EMAIL:", process.env.SHIPROCKET_EMAIL ? `CONFIGURED (${process.env.SHIPROCKET_EMAIL})` : 'MISSING ❌');
      console.log("PASSWORD FOUND:", !!process.env.SHIPROCKET_PASSWORD);
      console.log("PICKUP LOCATION:", process.env.SHIPROCKET_PICKUP_LOCATION || "Home");
      console.log("===================================");
      startProgressionService();
    });
  })
  .catch(err => {
    console.error('[SERVER FATAL] Database connection failed. Shutting down application:', err.message);
    process.exit(1);
  });

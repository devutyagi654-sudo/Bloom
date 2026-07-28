const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get all products (with filtering, sorting, searching)
const getProducts = async (req, res) => {
  try {
    const query = {};

    // Badges/Flags filters
    if (req.query.isTrending === 'true') {
      query.isTrending = true;
    }
    if (req.query.isBestSeller === 'true') {
      query.isBestSeller = true;
    }
    if (req.query.isFeatured === 'true') {
      query.isFeatured = true;
    }
    if (req.query.isNewArrival === 'true') {
      query.isNewArrival = true;
    }
    if (req.query.limitedOffer === 'true') {
      query.limitedOffer = true;
    }

    let products = await Product.find(query).lean();

    // Search query
    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      products = products.filter(p => 
        String(p.name || '').toLowerCase().includes(search) || 
        String(p.description || '').toLowerCase().includes(search)
      );
    }

    // Category filter
    if (req.query.category) {
      const cat = req.query.category.toLowerCase().trim();
      products = products.filter(p => {
        const prodCat = String(p.category || '').toLowerCase().trim();
        const prodName = String(p.name || '').toLowerCase();
        
        if (cat === 'bracelet' || cat === 'bracelets' || cat === 'bangles') {
          return prodCat === 'bangles' || prodCat === 'bracelet' || prodCat === 'bracelets' || prodName.includes('bangle') || prodName.includes('bracelet');
        }
        if (cat === 'watch' || cat === 'watches') {
          return prodCat === 'watches' || prodCat === 'watch' || prodName.includes('watch');
        }
        if (cat === 'pendant' || cat === 'pendants') {
          return prodCat === 'pendant' || prodCat === 'pendants' || prodCat === 'necklaces' || prodCat === 'rings' || prodName.includes('pendant') || prodName.includes('necklace') || prodName.includes('ring');
        }
        if (cat === 'hamper' || cat === 'hampers') {
          return prodCat === 'hamper' || prodCat === 'hampers' || prodName.includes('hamper') || prodName.includes('box');
        }
        
        return prodCat === cat;
      });
    }

    // Sort by price or date or ratings
    if (req.query.sort) {
      const sort = req.query.sort;
      if (sort === 'price-low-high') {
        products.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sort === 'price-high-low') {
        products.sort((a, b) => Number(b.price) - Number(a.price));
      } else if (sort === 'newest') {
        products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else if (sort === 'ratings') {
        products.sort((a, b) => Number(b.ratings || 0) - Number(a.ratings || 0));
      }
    }

    const formattedProducts = products.map(p => ({
      ...p,
      id: p._id,
      images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : [])
    }));

    return res.json(formattedProducts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error fetching products' });
  }
};

// Get product details
const getProductById = async (req, res) => {
  try {
    const paramId = req.params.id;
    let product = null;

    if (mongoose.Types.ObjectId.isValid(paramId)) {
      product = await Product.findById(paramId);
    }
    if (!product) {
      product = await Product.findOne({ _id: paramId });
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productObj = product.toObject();
    productObj.id = productObj._id;
    productObj.images = Array.isArray(productObj.images) ? productObj.images : (productObj.images ? [productObj.images] : []);

    return res.json(productObj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error fetching product details' });
  }
};

// Add product review
const addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Please provide rating and comment' });
    }
    
    const paramId = req.params.id;
    let product = null;
    if (mongoose.Types.ObjectId.isValid(paramId)) {
      product = await Product.findById(paramId);
    }
    if (!product) {
      product = await Product.findOne({ _id: paramId });
    }
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const userId = req.user.id || req.user._id;
    const reviews = product.reviews || [];
    
    // Check if user already reviewed
    const alreadyReviewed = reviews.some(r => String(r.userId) === String(userId));
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed by you' });
    }
    
    const review = {
      userId: userId,
      userName: req.user.fullName,
      rating: Number(rating),
      comment,
      createdAt: new Date()
    };
    
    product.reviews.push(review);
    
    // Recalculate average ratings
    const totalRating = product.reviews.reduce((acc, item) => item.rating + acc, 0);
    product.ratings = Number((totalRating / product.reviews.length).toFixed(1));
    
    await product.save();
    
    const productObj = product.toObject();
    productObj.id = productObj._id;

    return res.status(201).json({ message: 'Review added successfully', product: productObj });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error adding review' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  addProductReview
};

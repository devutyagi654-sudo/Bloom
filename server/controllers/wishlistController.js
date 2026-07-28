const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get wishlist items
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userWishlistItems = await Wishlist.find({ userId }).sort({ createdAt: -1 }).lean();
    
    const populated = await Promise.all(userWishlistItems.map(async (item) => {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        product = await Product.findById(item.productId).lean();
      }
      if (!product) {
        product = await Product.findOne({ _id: item.productId }).lean();
      }

      if (!product) return null;

      return {
        id: item._id,
        _id: item._id,
        productId: item.productId,
        createdAt: item.createdAt,
        product: {
          id: product._id,
          _id: product._id,
          name: product.name,
          price: Number(product.price),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
          category: product.category,
          stock: Number(product.stock),
          images: Array.isArray(product.images) ? product.images : (product.images ? [product.images] : [])
        }
      };
    }));

    const validWishlist = populated.filter(item => item !== null);
    return res.json(validWishlist);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving wishlist' });
  }
};

// Toggle wishlist item (Add if doesn't exist, remove if exists)
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    let product = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne({ _id: productId });
    }
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const userId = req.user.id || req.user._id;
    const existing = await Wishlist.findOne({ userId, productId });
    
    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      return res.json({ message: 'Removed from wishlist', isAdded: false });
    } else {
      const newItem = await Wishlist.create({
        userId,
        productId
      });
      const obj = newItem.toObject();
      obj.id = obj._id;
      return res.status(201).json({ message: 'Added to wishlist', isAdded: true, item: obj });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error toggling wishlist' });
  }
};

module.exports = {
  getWishlist,
  toggleWishlist
};

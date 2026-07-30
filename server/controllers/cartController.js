const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Helper to identify Bangles category products strictly
const isBanglesCategory = (product) => {
  if (!product) return false;
  const cat = String(product.category || '').toLowerCase().trim();
  return cat === 'bangles' || cat === 'bangle';
};

// Get user cart items
const getCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userCartItems = await Cart.find({ userId }).sort({ createdAt: -1 }).lean();
    
    // Populate product details
    const populatedCart = await Promise.all(userCartItems.map(async (item) => {
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
        quantity: Number(item.quantity),
        selectedSize: item.selectedSize || '',
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

    // Filter out nulls (orphaned cart items)
    const validCart = populatedCart.filter(item => item !== null);
    
    return res.json(validCart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving cart' });
  }
};

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity, selectedSize } = req.body;
    const qty = Number(quantity) || 1;
    
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
    
    if (Number(product.stock) <= 0) {
      return res.status(400).json({ message: 'Product is out of stock' });
    }

    // Validate size selection for Bangles category
    if (isBanglesCategory(product) && (!selectedSize || !String(selectedSize).trim())) {
      return res.status(400).json({ message: 'Please select a bangle size.' });
    }
    
    const userId = req.user.id || req.user._id;
    const sizeVal = selectedSize ? String(selectedSize).trim() : '';

    let cartItem = await Cart.findOne({ userId, productId, selectedSize: sizeVal });
    
    if (cartItem) {
      const newQty = cartItem.quantity + qty;
      if (newQty > Number(product.stock)) {
        return res.status(400).json({ message: `Cannot add more. Only ${product.stock} units available in stock.` });
      }
      
      cartItem.quantity = newQty;
      await cartItem.save();
      const obj = cartItem.toObject();
      obj.id = obj._id;
      return res.json(obj);
    } else {
      if (qty > Number(product.stock)) {
        return res.status(400).json({ message: `Cannot add ${qty} units. Only ${product.stock} available.` });
      }
      
      const newItem = await Cart.create({
        userId,
        productId,
        quantity: qty,
        selectedSize: sizeVal
      });
      const obj = newItem.toObject();
      obj.id = obj._id;
      return res.status(201).json(obj);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error adding to cart' });
  }
};

// Update cart quantity
const updateCartQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { id } = req.params;
    
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }
    
    const userId = req.user.id || req.user._id;
    let cartItem = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      cartItem = await Cart.findById(id);
    }
    if (!cartItem) {
      cartItem = await Cart.findOne({ _id: id, userId });
    }
    
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    let product = null;
    if (mongoose.Types.ObjectId.isValid(cartItem.productId)) {
      product = await Product.findById(cartItem.productId);
    }
    if (!product) {
      product = await Product.findOne({ _id: cartItem.productId });
    }
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (qty > Number(product.stock)) {
      return res.status(400).json({ message: `Only ${product.stock} units available in stock.` });
    }
    
    cartItem.quantity = qty;
    await cartItem.save();
    
    const obj = cartItem.toObject();
    obj.id = obj._id;
    return res.json(obj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating cart quantity' });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    
    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await Cart.findOneAndDelete({ _id: id, userId });
    }
    if (!deleted) {
      deleted = await Cart.findOneAndDelete({ _id: id, userId });
    }
    
    if (!deleted) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    return res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error removing from cart' });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Cart.deleteMany({ userId });
    return res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error clearing cart' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart
};

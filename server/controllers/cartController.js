const { getTableData, insertRow, updateRow, deleteRow, writeTableData } = require('../config/db');

// Get user cart items
const getCart = async (req, res) => {
  try {
    const carts = getTableData('cart.xlsx');
    const products = getTableData('products.xlsx');
    
    // Filter rows for current user
    const userCartItems = carts.filter(item => String(item.userId) === String(req.user.id));
    
    // Populate product details
    const populatedCart = userCartItems.map(item => {
      const product = products.find(p => String(p.id) === String(item.productId));
      return {
        id: item.id,
        productId: item.productId,
        quantity: Number(item.quantity),
        createdAt: item.createdAt,
        product: product ? {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
          category: product.category,
          stock: Number(product.stock),
          images: product.images,
        } : null
      };
    }).filter(item => item.product !== null); // remove orphaned cart items
    
    return res.json(populatedCart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving cart' });
  }
};

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity) || 1;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    const products = getTableData('products.xlsx');
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (Number(product.stock) <= 0) {
      return res.status(400).json({ message: 'Product is out of stock' });
    }
    
    const carts = getTableData('cart.xlsx');
    
    // Check if product is already in user's cart
    const existingIndex = carts.findIndex(item => 
      String(item.userId) === String(req.user.id) && String(item.productId) === String(productId)
    );
    
    if (existingIndex !== -1) {
      // Check stock limit
      const currentQty = Number(carts[existingIndex].quantity);
      const newQty = currentQty + qty;
      if (newQty > Number(product.stock)) {
        return res.status(400).json({ message: `Cannot add more. Only ${product.stock} units available in stock.` });
      }
      
      const updated = updateRow('cart.xlsx', carts[existingIndex].id, {
        quantity: newQty
      });
      return res.json(updated);
    } else {
      if (qty > Number(product.stock)) {
        return res.status(400).json({ message: `Cannot add ${qty} units. Only ${product.stock} available.` });
      }
      
      const newItem = insertRow('cart.xlsx', {
        userId: req.user.id,
        productId,
        quantity: qty
      });
      return res.status(201).json(newItem);
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
    const { id } = req.params; // cart item row ID
    
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }
    
    const carts = getTableData('cart.xlsx');
    const cartItem = carts.find(item => String(item.id) === String(id) && String(item.userId) === String(req.user.id));
    
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    const products = getTableData('products.xlsx');
    const product = products.find(p => String(p.id) === String(cartItem.productId));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (qty > Number(product.stock)) {
      return res.status(400).json({ message: `Only ${product.stock} units available in stock.` });
    }
    
    const updated = updateRow('cart.xlsx', id, {
      quantity: qty
    });
    
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating cart quantity' });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params; // cart item row ID
    
    const carts = getTableData('cart.xlsx');
    const cartItem = carts.find(item => String(item.id) === String(id) && String(item.userId) === String(req.user.id));
    
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    deleteRow('cart.xlsx', id);
    return res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error removing from cart' });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const carts = getTableData('cart.xlsx');
    const filteredCarts = carts.filter(item => String(item.userId) !== String(req.user.id));
    writeTableData('cart.xlsx', filteredCarts);
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

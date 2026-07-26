const { getTableData, insertRow, deleteRow } = require('../config/db');

// Get wishlist items
const getWishlist = async (req, res) => {
  try {
    const wishlist = getTableData('wishlist.xlsx');
    const products = getTableData('products.xlsx');
    
    const userWishlistItems = wishlist.filter(item => String(item.userId) === String(req.user.id));
    
    // Populate products
    const populated = userWishlistItems.map(item => {
      const product = products.find(p => String(p.id) === String(item.productId));
      return product ? {
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt,
        product: {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
          category: product.category,
          stock: Number(product.stock),
          images: product.images
        }
      } : null;
    }).filter(item => item !== null);
    
    return res.json(populated);
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
    
    const products = getTableData('products.xlsx');
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const wishlist = getTableData('wishlist.xlsx');
    
    const index = wishlist.findIndex(item => 
      String(item.userId) === String(req.user.id) && String(item.productId) === String(productId)
    );
    
    if (index !== -1) {
      // Remove
      deleteRow('wishlist.xlsx', wishlist[index].id);
      return res.json({ message: 'Removed from wishlist', isAdded: false });
    } else {
      // Add
      const newItem = insertRow('wishlist.xlsx', {
        userId: req.user.id,
        productId
      });
      return res.status(201).json({ message: 'Added to wishlist', isAdded: true, item: newItem });
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

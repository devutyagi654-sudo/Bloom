const { getTableData, updateRow } = require('../config/db');

// Get all products (with filtering, sorting, searching)
const getProducts = async (req, res) => {
  try {
    const products = getTableData('products.xlsx');
    let filteredProducts = products.map(p => {
      let parsedImages = [];
      if (p.images) {
        if (typeof p.images === 'string') {
          try {
            parsedImages = JSON.parse(p.images);
          } catch (e) {
            parsedImages = [p.images];
          }
        } else if (Array.isArray(p.images)) {
          parsedImages = p.images;
        }
      }
      return { ...p, images: parsedImages };
    });

    // Search query
    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        String(p.name).toLowerCase().includes(search) || 
        String(p.description).toLowerCase().includes(search)
      );
    }

    // Category filter
    if (req.query.category) {
      const cat = req.query.category.toLowerCase().trim();
      filteredProducts = filteredProducts.filter(p => {
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
        
        // Default strict comparison
        return prodCat === cat;
      });
    }

    // Badges/Flags filters
    if (req.query.isTrending === 'true') {
      filteredProducts = filteredProducts.filter(p => p.isTrending === true || String(p.isTrending) === 'true');
    }
    if (req.query.isBestSeller === 'true') {
      filteredProducts = filteredProducts.filter(p => p.isBestSeller === true || String(p.isBestSeller) === 'true');
    }
    if (req.query.isFeatured === 'true') {
      filteredProducts = filteredProducts.filter(p => p.isFeatured === true || String(p.isFeatured) === 'true');
    }
    if (req.query.isNewArrival === 'true') {
      filteredProducts = filteredProducts.filter(p => p.isNewArrival === true || String(p.isNewArrival) === 'true');
    }
    if (req.query.limitedOffer === 'true') {
      filteredProducts = filteredProducts.filter(p => p.limitedOffer === true || String(p.limitedOffer) === 'true');
    }

    // Sort by price or date
    if (req.query.sort) {
      const sort = req.query.sort;
      if (sort === 'price-low-high') {
        filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sort === 'price-high-low') {
        filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
      } else if (sort === 'newest') {
        filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sort === 'ratings') {
        filteredProducts.sort((a, b) => Number(b.ratings || 0) - Number(a.ratings || 0));
      }
    }

    return res.json(filteredProducts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error fetching products' });
  }
};

// Get product details
const getProductById = async (req, res) => {
  try {
    const products = getTableData('products.xlsx');
    const product = products.find(p => String(p.id) === String(req.params.id));
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    let parsedImages = [];
    if (product.images) {
      if (typeof product.images === 'string') {
        try {
          parsedImages = JSON.parse(product.images);
        } catch (e) {
          parsedImages = [product.images];
        }
      } else if (Array.isArray(product.images)) {
        parsedImages = product.images;
      }
    }
    
    const formattedProduct = { ...product, images: parsedImages };
    return res.json(formattedProduct);
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
    
    const products = getTableData('products.xlsx');
    const productIndex = products.findIndex(p => String(p.id) === String(req.params.id));
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const product = products[productIndex];
    
    // Parse reviews if it's string, else default to array
    let reviews = [];
    if (product.reviews) {
      reviews = Array.isArray(product.reviews) ? product.reviews : [];
    }
    
    // Check if user already reviewed
    const alreadyReviewed = reviews.some(r => String(r.userId) === String(req.user.id));
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed by you' });
    }
    
    const review = {
      userId: req.user.id,
      userName: req.user.fullName,
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString()
    };
    
    reviews.push(review);
    
    // Recalculate average ratings
    const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
    const avgRating = totalRating / reviews.length;
    
    const updated = updateRow('products.xlsx', product.id, {
      reviews: reviews,
      ratings: Number(avgRating.toFixed(1))
    });
    
    return res.status(201).json({ message: 'Review added successfully', product: updated });
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

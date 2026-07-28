const Category = require('../models/Category');

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error fetching categories' });
  }
};

module.exports = {
  getCategories
};

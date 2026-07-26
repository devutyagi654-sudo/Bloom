const { getTableData } = require('../config/db');

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = getTableData('categories.xlsx');
    return res.json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error fetching categories' });
  }
};

module.exports = {
  getCategories
};

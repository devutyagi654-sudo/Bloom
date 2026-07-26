const path = require('path');
const fs = require('fs');
const { getTableData, writeTableData, insertRow, deleteRow } = require('../config/db');

// Get active banners list
const getBanner = async (req, res) => {
  try {
    const banners = getTableData('banners.xlsx');
    return res.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Upload multiple banners
const uploadBanner = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload image files'
      });
    }

    const banners = getTableData('banners.xlsx');
    
    // Validate total count limit of 5 banners
    if (banners.length + req.files.length > 5) {
      // Cleanup temp uploaded files
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({
        success: false,
        message: 'Maximum limit of 5 banners reached. Delete some existing banners first.'
      });
    }

    for (const file of req.files) {
      const filename = file.filename;
      const bannerPath = `/uploads/banners/${filename}`;
      
      insertRow('banners.xlsx', {
        filename,
        bannerPath
      });
    }

    const updatedBanners = getTableData('banners.xlsx');

    return res.status(201).json({
      success: true,
      message: `${req.files.length} banner(s) uploaded successfully`,
      banners: updatedBanners
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
    // Cleanup files if error occurred
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete a specific banner by ID
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banners = getTableData('banners.xlsx');
    const banner = banners.find(b => String(b.id) === String(id));
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    if (banner.bannerPath && banner.bannerPath.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', banner.bannerPath);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Failed to delete banner file:', err);
        }
      }
    }

    // Delete row from excel database
    deleteRow('banners.xlsx', id);

    const updatedBanners = getTableData('banners.xlsx');

    return res.json({
      success: true,
      message: 'Banner deleted successfully',
      banners: updatedBanners
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  getBanner,
  uploadBanner,
  deleteBanner
};

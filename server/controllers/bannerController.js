const path = require('path');
const fs = require('fs');
const Banner = require('../models/Banner');
const { uploadToCloudinary } = require('../config/cloudinary');

// Get active banners list
const getBanner = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    const formatted = banners.map(b => {
      const obj = b.toObject();
      obj.id = obj._id;
      return obj;
    });
    return res.json(formatted);
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

    const currentCount = await Banner.countDocuments();
    
    // Validate total count limit of 5 banners
    if (currentCount + req.files.length > 5) {
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

    const host = `${req.protocol}://${req.get('host')}`;
    for (const file of req.files) {
      const filename = file.filename;
      const cloudinaryUrl = await uploadToCloudinary(file.path, 'banners');
      const bannerPath = cloudinaryUrl || `${host}/uploads/banners/${filename}`;
      
      await Banner.create({
        filename,
        bannerPath
      });
    }

    const updatedBanners = await Banner.find().sort({ createdAt: -1 });
    const formatted = updatedBanners.map(b => {
      const obj = b.toObject();
      obj.id = obj._id;
      return obj;
    });

    return res.status(201).json({
      success: true,
      message: `${req.files.length} banner(s) uploaded successfully`,
      banners: formatted
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
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
    const banner = await Banner.findById(id);
    
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

    await Banner.findByIdAndDelete(id);

    const updatedBanners = await Banner.find().sort({ createdAt: -1 });
    const formatted = updatedBanners.map(b => {
      const obj = b.toObject();
      obj.id = obj._id;
      return obj;
    });

    return res.json({
      success: true,
      message: 'Banner deleted successfully',
      banners: formatted
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

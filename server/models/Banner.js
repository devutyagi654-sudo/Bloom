const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  filename: {
    type: String,
    default: ''
  },
  bannerPath: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Banner', bannerSchema);

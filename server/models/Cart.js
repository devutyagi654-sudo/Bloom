const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  selectedSize: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Cart', cartSchema);

const mongoose = require('mongoose');

const orderStatusHistorySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  previousStatus: {
    type: String,
    default: ''
  },
  newStatus: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    default: 'System'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);

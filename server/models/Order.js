const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String,
    default: ''
  },
  selectedSize: {
    type: String,
    default: ''
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zip: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Razorpay', 'Card', 'UPI', 'NetBanking', 'MockPay'],
    default: 'Razorpay'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  shippingCharges: {
    type: Number,
    default: 0
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    default: ''
  },
  items: [orderItemSchema],
  orderStatus: {
    type: String,
    enum: [
      'Pending',
      'Order Confirmed',
      'Processing',
      'Ready to Ship',
      'Shipped',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
      'Return Requested',
      'Returned',
      'Refunded',
      'Failed'
    ],
    default: 'Pending',
    index: true
  },
  razorpayOrderId: {
    type: String,
    default: ''
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },
  razorpaySignature: {
    type: String,
    default: ''
  },
  shipmentId: {
    type: String,
    default: ''
  },
  trackingId: {
    type: String,
    default: ''
  },
  awbCode: {
    type: String,
    default: ''
  },
  courierName: {
    type: String,
    default: ''
  },
  trackingUrl: {
    type: String,
    default: ''
  },
  expectedDelivery: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Order', orderSchema);

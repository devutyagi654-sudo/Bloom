const crypto = require('crypto');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { createShipmentInternal } = require('./shippingController');
const { sendOrderStatusEmail, logOrderStatusHistory, transitionOrderStatus } = require('./orderController');

// Initialize Razorpay SDK if keys are configured
let razorpay = null;
const isRazorpayConfigured = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id' &&
                             process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret';

if (isRazorpayConfigured) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.log('Razorpay is running in SIMULATED MOCK MODE.');
}

// Create Razorpay Order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    if (razorpay) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`
      };
      const order = await razorpay.orders.create(options);
      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        mockMode: false
      });
    } else {
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      return res.json({
        success: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        mockMode: true
      });
    }
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ message: 'Error initiating online payment order' });
  }
};

// Verify Payment Signature & Create Order
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderData
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ message: 'Missing Razorpay order/payment reference details' });
    }

    let isSignatureValid = false;

    if (razorpay) {
      if (!razorpaySignature) {
        return res.status(400).json({ message: 'Signature is required for verification' });
      }
      const text = razorpayOrderId + '|' + razorpayPaymentId;
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');
      isSignatureValid = (generated_signature === razorpaySignature);
    } else {
      isSignatureValid = razorpayOrderId.startsWith('order_mock_');
    }

    if (!isSignatureValid) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const userId = req.user.id || req.user._id;

    // Check if the order already exists (Retry Payment flow!)
    const existingOrder = await Order.findOne({ razorpayOrderId });

    if (existingOrder) {
      existingOrder.paymentStatus = 'Paid';
      existingOrder.razorpayPaymentId = razorpayPaymentId;
      existingOrder.razorpaySignature = razorpaySignature || 'mock_signature';
      await existingOrder.save();

      console.log(`Prepaid order #${existingOrder._id} successfully updated on retry pay verification.`);

      const transitioned = await transitionOrderStatus(existingOrder._id, 'Order Confirmed', 'System', 'Prepaid payment verified successfully (Payment Retry)');

      await Cart.deleteMany({ userId });

      const resObj = (transitioned || existingOrder).toObject();
      resObj.id = resObj._id;
      return res.status(200).json(resObj);
    }

    // Process fresh order creation
    const {
      fullName, email, mobile, address, city, state, zip,
      shippingCharges, couponCode
    } = orderData || {};

    if (!fullName || !email || !mobile || !address || !city || !state || !zip) {
      return res.status(400).json({ message: 'Please provide all shipping and contact details' });
    }

    const userCart = await Cart.find({ userId });
    if (userCart.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of userCart) {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        product = await Product.findById(item.productId);
      }
      if (!product) {
        product = await Product.findOne({ _id: item.productId });
      }
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      const qty = Number(item.quantity);
      if (Number(product.stock) < qty) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const itemPrice = product.discountPrice ? Number(product.discountPrice) : Number(product.price);
      subtotal += itemPrice * qty;

      const imagesArr = Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []);

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: itemPrice,
        quantity: qty,
        image: imagesArr.length > 0 ? imagesArr[0] : ''
      });
    }

    let discount = 0;
    if (couponCode) {
      const code = couponCode.toUpperCase().trim();
      if (code === 'BLC10') {
        discount = subtotal * 0.10;
      } else if (code === 'LUXURY20') {
        discount = subtotal * 0.20;
      } else if (code === 'WELCOME500') {
        discount = Math.min(500, subtotal);
      }
    }

    const totalAmount = subtotal - discount;

    // Deduct stock
    for (const item of userCart) {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        product = await Product.findById(item.productId);
      }
      if (!product) {
        product = await Product.findOne({ _id: item.productId });
      }
      if (product) {
        product.stock = Math.max(0, Number(product.stock) - Number(item.quantity));
        await product.save();
      }
    }

    const order = await Order.create({
      userId,
      fullName,
      email: email.toLowerCase(),
      mobile,
      address,
      city,
      state,
      zip,
      paymentMethod: 'Razorpay',
      paymentStatus: 'Paid',
      totalAmount: Number(totalAmount.toFixed(2)),
      shippingCharges: 0,
      deliveryCharge: 0,
      couponCode: couponCode || '',
      items: orderItems,
      orderStatus: 'Pending',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || 'mock_signature'
    });

    await Cart.deleteMany({ userId });
    await logOrderStatusHistory(order._id, '', 'Pending', 'System', 'Order placed successfully (prepaid payment pending)');

    const transitionedOrder = await transitionOrderStatus(order._id, 'Order Confirmed', 'System', 'Prepaid payment verified successfully');

    const resObj = (transitionedOrder || order).toObject();
    resObj.id = resObj._id;
    return res.status(201).json(resObj);
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ message: 'Verification error placing order' });
  }
};

// Process Refund (Admin Action)
const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    let order = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ _id: orderId });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentMethod !== 'Razorpay') {
      return res.status(400).json({ message: 'Only prepaid online orders can be refunded' });
    }

    if (order.paymentStatus === 'Refunded') {
      return res.status(400).json({ message: 'Order payment is already refunded' });
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    if (razorpay && order.razorpayPaymentId && !order.razorpayPaymentId.startsWith('pay_mock')) {
      await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: amountInPaise,
        speed: 'normal',
        notes: { reason: 'Order Cancelled by Customer or Admin' }
      });
    }

    // Revert inventory stock
    try {
      const itemsList = Array.isArray(order.items) ? order.items : [];
      for (const item of itemsList) {
        let product = null;
        if (mongoose.Types.ObjectId.isValid(item.productId)) {
          product = await Product.findById(item.productId);
        }
        if (!product) {
          product = await Product.findOne({ _id: item.productId });
        }
        if (product) {
          product.stock = Number(product.stock) + Number(item.quantity);
          await product.save();
        }
      }
      console.log(`Reverted stock for refunded BLC Order #${order._id}`);
    } catch (stockErr) {
      console.error(stockErr);
    }

    order.paymentStatus = 'Refunded';
    order.orderStatus = 'Refunded';
    await order.save();

    try {
      await sendOrderStatusEmail(order, 'Refunded');
    } catch (e) {
      console.error('Nodemailer refund notification failed:', e);
    }

    const resObj = order.toObject();
    resObj.id = resObj._id;
    return res.json({ message: 'Payment successfully refunded', order: resObj });
  } catch (error) {
    console.error('Error processing refund:', error);
    return res.status(500).json({ message: error.message || 'Server error processing refund' });
  }
};

// Retry Payment for Existing Failed / Pending order
const retryRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    let order = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ _id: orderId });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const userId = req.user.id || req.user._id;
    if (String(order.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to retry this order' });
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    if (razorpay) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_retry_${order._id}_${Date.now()}`
      };
      const rzOrder = await razorpay.orders.create(options);

      order.razorpayOrderId = rzOrder.id;
      await order.save();

      return res.json({
        success: true,
        orderId: rzOrder.id,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        mockMode: false
      });
    } else {
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      
      order.razorpayOrderId = mockOrderId;
      await order.save();

      return res.json({
        success: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        mockMode: true
      });
    }
  } catch (error) {
    console.error('Error retrying payment order:', error);
    return res.status(500).json({ message: 'Error retrying payment order' });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  refundPayment,
  retryRazorpayOrder
};

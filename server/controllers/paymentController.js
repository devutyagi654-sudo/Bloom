const crypto = require('crypto');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { sendOrderStatusEmail, logOrderStatusHistory, transitionOrderStatus, restoreOrderStock } = require('./orderController');

// Initialize Razorpay SDK cleanly with trimmed keys from environment variables
const keyId = process.env.RAZORPAY_KEY_ID ? String(process.env.RAZORPAY_KEY_ID).trim() : '';
const keySecret = process.env.RAZORPAY_KEY_SECRET ? String(process.env.RAZORPAY_KEY_SECRET).trim() : '';

const isRazorpayConfigured = Boolean(
  keyId && keyId !== 'your_razorpay_key_id' &&
  keySecret && keySecret !== 'your_razorpay_key_secret'
);

let razorpay = null;
if (isRazorpayConfigured) {
  razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
  console.log('[RAZORPAY] SDK initialized with configured environment credentials.');
} else {
  console.log('[RAZORPAY] Running in SIMULATED MOCK MODE.');
}

// Create Razorpay Order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
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
        keyId,
        mockMode: false
      });
    } else {
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      return res.json({
        success: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: keyId || 'rzp_test_mockKey',
        mockMode: true
      });
    }
  } catch (error) {
    console.error("========== RAZORPAY CREATE ERROR ==========");
    console.error("Status Code:", error.statusCode);
    console.error("Error Details:", error.error || error.message);

    const rzMsg = error.error?.description || error.message || 'Authentication failed on Razorpay';

    return res.status(500).json({
      success: false,
      message: `Razorpay order creation failed: ${rzMsg}. Please check RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET credentials on Render / Dashboard.`,
      error: rzMsg,
      statusCode: error.statusCode
    });
  }
};

// Verify Payment Signature & Create / Update Order
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData
    } = req.body;

    const rzOrderId = String(razorpay_order_id || razorpayOrderId || '').trim();
    const rzPaymentId = String(razorpay_payment_id || razorpayPaymentId || '').trim();
    const rzSignature = String(razorpay_signature || razorpaySignature || '').trim();

    console.log('===================================');
    console.log('--- RAZORPAY VERIFICATION LOGS ---');
    console.log('Received razorpay_order_id:', rzOrderId);
    console.log('Received razorpay_payment_id:', rzPaymentId);
    console.log('Received razorpay_signature:', rzSignature);
    console.log('RAZORPAY_KEY_SECRET configured:', keySecret ? `YES (Length: ${keySecret.length}, Prefix: ${keySecret.substring(0, 4)}***)` : 'NO');

    if (!rzOrderId || !rzPaymentId) {
      console.error('[RAZORPAY_VERIFY_FAILURE] Missing razorpay_order_id or razorpay_payment_id');
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay order or payment reference ID'
      });
    }

    let isSignatureValid = false;
    let generated_signature = '';

    if (razorpay) {
      if (!rzSignature) {
        console.error('[RAZORPAY_VERIFY_FAILURE] Missing razorpay_signature in production mode');
        return res.status(400).json({
          success: false,
          message: 'Razorpay payment signature is required for verification'
        });
      }

      const text = `${rzOrderId}|${rzPaymentId}`;
      generated_signature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      isSignatureValid = (generated_signature === rzSignature);

      console.log('Generated signature:', generated_signature);
      console.log('Comparison result:', isSignatureValid ? 'MATCH ✅' : 'MISMATCH ❌');
      console.log('===================================');

      if (!isSignatureValid) {
        console.error('[RAZORPAY_VERIFY_FAILURE] Signature mismatch details:', {
          reason: 'Generated HMAC-SHA256 signature does not match received razorpay_signature.',
          expected: generated_signature,
          received: rzSignature,
          text_to_sign: text,
          key_secret_prefix: keySecret ? keySecret.substring(0, 4) + '***' : 'NONE'
        });
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: Signature mismatch. Please verify that RAZORPAY_KEY_SECRET in backend environment variables belongs to the exact same Razorpay account and environment as RAZORPAY_KEY_ID.'
        });
      }
    } else {
      // Mock mode validation for development testing
      isSignatureValid = Boolean(
        rzOrderId.startsWith('order_mock_') ||
        rzOrderId.startsWith('order_') ||
        rzOrderId.startsWith('BLC-') ||
        rzSignature === 'mock_signature'
      );
      console.log('Comparison result (Mock Mode):', isSignatureValid ? 'MATCH ✅' : 'MISMATCH ❌');
      console.log('===================================');
    }

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    const userId = req.user.id || req.user._id;

    // Check if order draft already exists in MongoDB
    const existingOrder = await Order.findOne({ razorpayOrderId: rzOrderId });

    if (existingOrder) {
      const isAlreadyPaid = existingOrder.paymentStatus === 'Paid' || existingOrder.paymentStatus === '₹100 Paid' || existingOrder.orderStatus === 'Order Confirmed';

      if (!isAlreadyPaid) {
        // Deduct inventory stock cleanly
        const itemsToDeduct = (existingOrder.items && existingOrder.items.length > 0) 
          ? existingOrder.items 
          : await Cart.find({ userId });

        for (const item of itemsToDeduct) {
          let product = null;
          const pId = item.productId || item._id;
          if (mongoose.Types.ObjectId.isValid(pId)) {
            product = await Product.findById(pId);
          }
          if (!product) {
            product = await Product.findOne({ _id: pId });
          }
          if (product) {
            product.stock = Math.max(0, Number(product.stock) - Number(item.quantity));
            await product.save();
          }
        }

        const isCodPrepaidOrder = existingOrder.paymentMethod === 'COD + Razorpay Prepaid' || existingOrder.prepaidAmount > 0;
        existingOrder.paymentStatus = isCodPrepaidOrder ? '₹100 Paid' : 'Paid';
        existingOrder.orderStatus = 'Order Confirmed';
        existingOrder.razorpayPaymentId = rzPaymentId;
        existingOrder.razorpaySignature = rzSignature || 'mock_signature';
        await existingOrder.save();

        console.log(`[RAZORPAY_VERIFY_SUCCESS] Existing Order #${existingOrder._id} marked as ${existingOrder.paymentStatus} & Confirmed.`);

        await transitionOrderStatus(existingOrder._id, 'Order Confirmed', 'System', `${isCodPrepaidOrder ? 'COD ₹100 prepaid deposit' : 'Full online payment'} verified successfully`);
        await Cart.deleteMany({ userId });
      }

      const resObj = existingOrder.toObject();
      resObj.id = resObj._id;

      return res.status(200).json({
        success: true,
        message: 'Payment verified and order updated successfully',
        order: resObj
      });
    }

    // Fresh Order Creation after verified payment signature
    const {
      fullName, email, mobile, address, city, state, zip
    } = orderData || {};

    if (!fullName || !email || !mobile || !address || !city || !state || !zip) {
      console.error('[RAZORPAY_VERIFY_FAILURE] Missing shipping details in orderData:', orderData);
      return res.status(400).json({
        success: false,
        message: 'Please provide all shipping and contact details'
      });
    }

    const userCart = await Cart.find({ userId });
    if (userCart.length === 0) {
      console.error('[RAZORPAY_VERIFY_FAILURE] Shopping cart is empty for user:', userId);
      return res.status(400).json({
        success: false,
        message: 'Your shopping cart is empty'
      });
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
        console.error('[RAZORPAY_VERIFY_FAILURE] Product not found for ID:', item.productId);
        return res.status(404).json({
          success: false,
          message: 'One or more products in your cart were not found'
        });
      }

      const qty = Number(item.quantity);
      if (Number(product.stock) < qty) {
        console.error(`[RAZORPAY_VERIFY_FAILURE] Insufficient stock for ${product.name}. Stock: ${product.stock}, Req: ${qty}`);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const itemPrice = product.discountPrice ? Number(product.discountPrice) : Number(product.price);
      subtotal += itemPrice * qty;

      const imagesArr = Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []);

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: itemPrice,
        quantity: qty,
        image: imagesArr.length > 0 ? imagesArr[0] : '',
        selectedSize: item.selectedSize || ''
      });
    }

    const totalAmount = subtotal;

    // Deduct stock in Product documents
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

    // Save order to MongoDB
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
      couponCode: '',
      items: orderItems,
      orderStatus: 'Order Confirmed',
      razorpayOrderId: rzOrderId,
      razorpayPaymentId: rzPaymentId,
      razorpaySignature: rzSignature || 'mock_signature'
    });

    console.log(`[RAZORPAY_VERIFY_SUCCESS] Order #${order._id} created and saved to MongoDB.`);

    // Clear cart after order is successfully placed
    await Cart.deleteMany({ userId });
    await logOrderStatusHistory(order._id, '', 'Order Confirmed', 'System', 'Prepaid payment verified and order created');

    // Trigger Shiprocket Order Creation for Prepaid Order
    try {
      const { createShipmentInternal } = require('./shippingController');
      console.log(`[PREPAID_SHIPROCKET] Pushing Prepaid Order #${order._id} to Shiprocket API...`);
      const dispatchedOrder = await createShipmentInternal(order._id);
      if (dispatchedOrder) {
        order = dispatchedOrder;
      }
    } catch (srErr) {
      console.error(`[PREPAID_SHIPROCKET_ERROR] Failed auto-dispatch for Prepaid Order #${order._id}:`, srErr.message);
    }

    try {
      await sendOrderStatusEmail(order, 'Order Confirmed');
    } catch (mailErr) {
      console.error('[MAIL_ERROR] Order confirmation email notification failed:', mailErr.message);
    }

    const resObj = order.toObject();
    resObj.id = resObj._id;

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order created successfully',
      order: resObj
    });

  } catch (error) {
    console.error('[RAZORPAY_VERIFY_CRITICAL_ERROR] Exception in verifyPayment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing payment verification'
    });
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
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentMethod !== 'Razorpay') {
      return res.status(400).json({ success: false, message: 'Only prepaid online orders can be refunded' });
    }

    if (order.paymentStatus === 'Refunded') {
      return res.status(400).json({ success: false, message: 'Order payment is already refunded' });
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    if (razorpay && order.razorpayPaymentId && !order.razorpayPaymentId.startsWith('pay_mock')) {
      await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: amountInPaise,
        speed: 'normal',
        notes: { reason: 'Order Cancelled by Customer or Admin' }
      });
    }

    order.paymentStatus = 'Refunded';
    order.orderStatus = 'Refunded';
    await order.save();

    // Revert inventory stock safely (idempotent)
    await restoreOrderStock(order);

    try {
      await sendOrderStatusEmail(order, 'Refunded');
    } catch (e) {
      console.error('Nodemailer refund notification failed:', e);
    }

    const resObj = order.toObject();
    resObj.id = resObj._id;
    return res.json({ success: true, message: 'Payment successfully refunded', order: resObj });
  } catch (error) {
    console.error('Error processing refund:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error processing refund' });
  }
};

// Retry Payment for Existing Failed / Pending order
const retryRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    let order = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ _id: orderId });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const userId = req.user.id || req.user._id;
    if (String(order.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to retry this order' });
    }

    const retryAmount = (order.paymentMethod === 'COD + Razorpay Prepaid' || (order.prepaidAmount > 0 && order.codAmount > 0))
      ? (order.prepaidAmount || 100)
      : order.totalAmount;

    const amountInPaise = Math.round(Number(retryAmount) * 100);

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
        keyId,
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
        keyId: keyId || 'rzp_test_mockKey',
        mockMode: true
      });
    }
  } catch (error) {
    console.error('Error retrying payment order:', error);
    return res.status(500).json({ success: false, message: 'Error retrying payment order' });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  refundPayment,
  retryRazorpayOrder
};

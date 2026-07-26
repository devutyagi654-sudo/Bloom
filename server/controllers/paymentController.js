const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getTableData, insertRow, updateRow, writeTableData } = require('../config/db');
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
    const { amount } = req.body; // Amount in Rupees
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
      // Mock Razorpay order creation
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
      orderData // full checkout details
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ message: 'Missing Razorpay order/payment reference details' });
    }

    // Verify signature
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
      // Mock verification mode
      isSignatureValid = razorpayOrderId.startsWith('order_mock_');
    }

    if (!isSignatureValid) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Check if the order already exists (Retry Payment flow!)
    const orders = getTableData('orders.xlsx');
    const existingOrder = orders.find(o => String(o.razorpayOrderId) === String(razorpayOrderId));

    if (existingOrder) {
      // Update existing order payment details
      updateRow('orders.xlsx', existingOrder.id, {
        paymentStatus: 'Paid',
        razorpayPaymentId,
        razorpaySignature: razorpaySignature || 'mock_signature'
      });

      console.log(`Prepaid order #${existingOrder.id} successfully updated on retry pay verification.`);

      // Transition status to Order Confirmed
      const transitioned = await transitionOrderStatus(existingOrder.id, 'Order Confirmed', 'System', 'Prepaid payment verified successfully (Payment Retry)');

      // Clear user cart
      try {
        const carts = getTableData('cart.xlsx');
        const remainingCarts = carts.filter(item => String(item.userId) !== String(req.user.id));
        writeTableData('cart.xlsx', remainingCarts);
      } catch (cartErr) {
        console.error(cartErr);
      }

      return res.status(200).json(transitioned || existingOrder);
    }

    // Process fresh order creation (similar to createOrder in orderController.js)
    const {
      fullName, email, mobile, address, city, state, zip,
      shippingCharges, couponCode
    } = orderData;

    if (!fullName || !email || !mobile || !address || !city || !state || !zip) {
      return res.status(400).json({ message: 'Please provide all shipping and contact details' });
    }

    const carts = getTableData('cart.xlsx');
    const products = getTableData('products.xlsx');

    const userCart = carts.filter(item => String(item.userId) === String(req.user.id));
    if (userCart.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of userCart) {
      const product = products.find(p => String(p.id) === String(item.productId));
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      const qty = Number(item.quantity);
      if (Number(product.stock) < qty) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const itemPrice = product.discountPrice ? Number(product.discountPrice) : Number(product.price);
      subtotal += itemPrice * qty;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: itemPrice,
        quantity: qty,
        image: product.images && product.images.length > 0 ? product.images[0] : ''
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

    const totalAmount = subtotal - discount; // Free delivery for online payments

    // Deduct stock
    for (const item of userCart) {
      const product = products.find(p => String(p.id) === String(item.productId));
      updateRow('products.xlsx', product.id, {
        stock: Number(product.stock) - Number(item.quantity)
      });
    }

    // Insert order record into Excel database
    const order = insertRow('orders.xlsx', {
      userId: req.user.id,
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
      orderStatus: 'Pending', // Fresh order starts as Pending
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || 'mock_signature',
      shipmentId: '',
      trackingId: '',
      awbCode: '',
      courierName: '',
      trackingUrl: '',
      expectedDelivery: ''
    });

    // Clear cart
    const remainingCarts = carts.filter(item => String(item.userId) !== String(req.user.id));
    writeTableData('cart.xlsx', remainingCarts);

    // Initial status history log
    logOrderStatusHistory(order.id, '', 'Pending', 'System', 'Order placed successfully (prepaid payment pending)');

    // Transition status to Order Confirmed (this dispatches shipment and alerts customer)
    const transitionedOrder = await transitionOrderStatus(order.id, 'Order Confirmed', 'System', 'Prepaid payment verified successfully');

    return res.status(201).json(transitionedOrder || order);
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ message: 'Verification error placing order' });
  }
};

// Process Refund (Admin Action)
const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = getTableData('orders.xlsx');
    const orderIndex = orders.findIndex(o => String(o.id) === String(orderId));

    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[orderIndex];
    if (order.paymentMethod !== 'Razorpay') {
      return res.status(400).json({ message: 'Only prepaid online orders can be refunded' });
    }

    if (order.paymentStatus === 'Refunded') {
      return res.status(400).json({ message: 'Order payment is already refunded' });
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    if (razorpay && order.razorpayPaymentId && !order.razorpayPaymentId.startsWith('pay_mock')) {
      // Execute live Razorpay refund
      await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: amountInPaise,
        speed: 'normal',
        notes: { reason: 'Order Cancelled by Customer or Admin' }
      });
    }

    // Revert inventory stock
    try {
      const products = getTableData('products.xlsx');
      let itemsList = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
      itemsList.forEach(item => {
        const product = products.find(p => String(p.id) === String(item.productId));
        if (product) {
          updateRow('products.xlsx', product.id, {
            stock: Number(product.stock) + Number(item.quantity)
          });
        }
      });
      console.log(`Reverted stock for refunded BLC Order #${order.id}`);
    } catch (stockErr) {
      console.error(stockErr);
    }

    // Update spreadsheet records
    const updated = updateRow('orders.xlsx', order.id, {
      paymentStatus: 'Refunded',
      orderStatus: 'Refunded'
    });

    // Send notification email
    try {
      await sendOrderStatusEmail(updated, 'Refunded');
    } catch (e) {
      console.error('Nodemailer refund notification failed:', e);
    }

    return res.json({ message: 'Payment successfully refunded', order: updated });
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

    const orders = getTableData('orders.xlsx');
    const order = orders.find(o => String(o.id) === String(orderId));

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify ownership
    if (String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to retry this order' });
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    if (razorpay) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_retry_${order.id}_${Date.now()}`
      };
      const rzOrder = await razorpay.orders.create(options);

      // Update order status with new razorpayOrderId
      updateRow('orders.xlsx', order.id, {
        razorpayOrderId: rzOrder.id
      });

      return res.json({
        success: true,
        orderId: rzOrder.id,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        mockMode: false
      });
    } else {
      // Mock retry order
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      
      updateRow('orders.xlsx', order.id, {
        razorpayOrderId: mockOrderId
      });

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

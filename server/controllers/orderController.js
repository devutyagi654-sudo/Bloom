const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const axios = require('axios');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const OrderStatusHistory = require('../models/OrderStatusHistory');

// Helper to identify Bangles / Bracelet products
const isBanglesCategory = (product) => {
  if (!product) return false;
  const cat = String(product.category || '').toLowerCase().trim();
  const name = String(product.name || '').toLowerCase();
  return cat.includes('bangle') || cat.includes('bracelet') || name.includes('bangle') || name.includes('bracelet');
};

// Initialize Razorpay SDK if keys are configured
let razorpay = null;
const isRazorpayConfigured = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id' &&
                             process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret';

if (isRazorpayConfigured) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// SMTP Email Transporter Setup
let transporter = null;
const isSMTPConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

if (isSMTPConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Mail Dispatcher Helper
const sendOrderStatusEmail = async (order, status) => {
  const mailSubjectMap = {
    'Pending': `bloomluxecollection - Order Placed [#BLC-${order._id || order.id}]`,
    'Order Confirmed': `bloomluxecollection - Order Confirmed [#BLC-${order._id || order.id}]`,
    'Processing': `bloomluxecollection - Order Processing [#BLC-${order._id || order.id}]`,
    'Ready to Ship': `bloomluxecollection - Ready to Ship [#BLC-${order._id || order.id}]`,
    'Shipped': `bloomluxecollection - Order Shipped [#BLC-${order._id || order.id}]`,
    'Out for Delivery': `bloomluxecollection - Out for Delivery [#BLC-${order._id || order.id}]`,
    'Delivered': `bloomluxecollection - Order Delivered [#BLC-${order._id || order.id}]`,
    'Cancelled': `bloomluxecollection - Order Cancelled [#BLC-${order._id || order.id}]`,
    'Return Requested': `bloomluxecollection - Return Requested [#BLC-${order._id || order.id}]`,
    'Returned': `bloomluxecollection - Order Returned [#BLC-${order._id || order.id}]`,
    'Refunded': `bloomluxecollection - Refund Completed [#BLC-${order._id || order.id}]`,
    'Failed': `bloomluxecollection - Payment Failed [#BLC-${order._id || order.id}]`
  };

  const subject = mailSubjectMap[status] || `bloomluxecollection - Status Update [#BLC-${order._id || order.id}]`;

  const itemDetails = (order.items || []).map(item => 
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #f2e8dc;">
        ${item.name} x ${item.quantity} ${item.selectedSize ? `<br/><small style="color:#8a502d;">Size: ${item.selectedSize}</small>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #f2e8dc; text-align: right;">₹${item.price}</td>
    </tr>`
  ).join('');

  const htmlContent = `
    <div style="font-family: 'Times New Roman', Times, serif; color: #220f05; background-color: #fcfaf7; padding: 30px; border: 1px solid #eccfb2; max-width: 600px; margin: auto;">
      <div style="text-align: center; border-bottom: 2px solid #b47248; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="letter-spacing: 4px; font-weight: 900; margin: 0; color: #2e1407;">B L C   A T E L I E R</h1>
        <p style="text-transform: uppercase; font-size: 10px; letter-spacing: 2px; color: #8a502d; margin: 5px 0 0 0;">Transaction Invoice Alert</p>
      </div>

      <p>Dear <strong>${order.fullName}</strong>,</p>
      <p>Your bloomluxecollection order status has been updated to: <span style="background-color: #eccfb2; padding: 4px 8px; font-weight: bold; border-radius: 4px;">${status}</span></p>

      <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #f7efe6; margin: 20px 0;">
        <h3 style="margin-top: 0; border-bottom: 1px solid #f7efe6; padding-bottom: 8px;">Order Details</h3>
        <p style="margin: 5px 0;"><strong>Order Reference:</strong> #BLC-${order._id || order.id}</p>
        <p style="margin: 5px 0;"><strong>Payment Method:</strong> Online Payment (${order.paymentStatus})</p>
        ${order.awbCode ? `<p style="margin: 5px 0;"><strong>AWB Tracking ID:</strong> ${order.awbCode} (${order.courierName})</p>` : ''}
        ${order.trackingUrl ? `<p style="margin: 5px 0;"><a href="${order.trackingUrl}" style="color: #c18055; font-weight: bold;">Track Live on Courier Portal</a></p>` : ''}
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f7efe6;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eccfb2;">Item Details</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eccfb2;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemDetails}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Grand Total:</td>
            <td style="padding: 10px; font-weight: bold; text-align: right;">₹${order.totalAmount}</td>
          </tr>
        </tfoot>
      </table>

      <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #8a502d; border-top: 1px solid #eccfb2; padding-top: 20px;">
        <p>© 2026 bloomluxecollection. All rights reserved.</p>
        <p>This is an automated shipping status updates notification system.</p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"bloomluxecollection" <${process.env.SMTP_USER}>`,
        to: order.email,
        subject: subject,
        html: htmlContent
      });
      console.log(`Email successfully dispatched to ${order.email} for order #${order._id || order.id} status: ${status}`);
    } catch (err) {
      console.error('SMTP Send Error:', err.message);
    }
  } else {
    console.log(`[SIMULATED EMAIL LOG] to: ${order.email} | Subject: ${subject} | Status: ${status}`);
  }
};

const logOrderStatusHistory = async (orderId, previousStatus, newStatus, updatedBy = 'System', notes = '') => {
  try {
    await OrderStatusHistory.create({
      orderId: String(orderId),
      previousStatus: previousStatus || '',
      newStatus: newStatus || '',
      updatedBy: updatedBy || 'System',
      notes: notes || '',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error logging order status history:', err.message);
  }
};

const transitionOrderStatus = async (orderId, newStatus, updatedBy = 'System', notes = '') => {
  let order = null;
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    order = await Order.findById(orderId);
  }
  if (!order) {
    order = await Order.findOne({ _id: orderId });
  }

  if (!order) return null;

  const previousStatus = order.orderStatus;
  if (previousStatus === newStatus) return order;

  order.orderStatus = newStatus;
  await order.save();

  let updatedOrder = order;

  // If status transitions to "Order Confirmed" and shipment isn't created, trigger dispatch
  if (newStatus === 'Order Confirmed' && !updatedOrder.awbCode) {
    try {
      const { createShipmentInternal } = require('./shippingController');
      const dispatched = await createShipmentInternal(orderId);
      if (dispatched) {
        updatedOrder = dispatched;
      }
    } catch (err) {
      console.error(`Automatic shiprocket dispatch failed for order #${orderId} on confirmation:`, err.message);
    }
  }

  await logOrderStatusHistory(orderId, previousStatus, newStatus, updatedBy, notes);

  try {
    await sendOrderStatusEmail(updatedOrder, newStatus);
  } catch (err) {
    console.error(`Failed to send status update email for order #${orderId}:`, err.message);
  }

  return updatedOrder;
};

// Create a new order (Online Payment / Razorpay Checkout)
const createOrder = async (req, res) => {
  try {
    const {
      fullName, email, mobile, address, city, state, zip,
      paymentMethod, couponCode
    } = req.body;
    
    if (!fullName || !email || !mobile || !address || !city || !state || !zip) {
      return res.status(400).json({ message: 'Please provide all shipping and contact details' });
    }

    const userId = req.user.id || req.user._id;
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
        return res.status(404).json({ message: `Product not found` });
      }

      // Mandatory size check for Bangles category
      if (isBanglesCategory(product) && (!item.selectedSize || !String(item.selectedSize).trim())) {
        return res.status(400).json({ message: `Please select a bangle size for item: ${product.name}` });
      }
      
      const qty = Number(item.quantity);
      if (Number(product.stock) < qty) {
        return res.status(400).json({ 
          message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}` 
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
    
    const deliveryCharge = 0;
    const totalAmount = subtotal - discount;
    
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
    
    let rzOrderId = '';
    let mockMode = true;
    const amountInPaise = Math.round(Number(totalAmount) * 100);

    if (razorpay) {
      try {
        const rzOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_draft_${Date.now()}`
        });
        rzOrderId = rzOrder.id;
        mockMode = false;
      } catch (rzErr) {
        console.error('Razorpay SDK failed generating order draft:', rzErr.message);
        rzOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      }
    } else {
      rzOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
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
      paymentStatus: 'Failed',
      totalAmount: Number(totalAmount.toFixed(2)),
      shippingCharges: 0,
      deliveryCharge: 0,
      couponCode: couponCode || '',
      items: orderItems,
      orderStatus: 'Pending',
      razorpayOrderId: rzOrderId
    });

    const orderObj = order.toObject();
    orderObj.id = orderObj._id;

    await logOrderStatusHistory(order._id, '', 'Pending', 'System', 'Order draft created (prepaid payment pending)');

    return res.status(201).json({
      ...orderObj,
      mockMode,
      amount: amountInPaise,
      currency: 'INR'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error placing order' });
  }
};

// Get orders of logged-in user
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    
    const formatted = orders.map(o => ({ ...o, id: o._id }));
    return res.json(formatted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error listing orders' });
  }
};

// Get details of a single order
const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).lean();
    }
    if (!order) {
      order = await Order.findOne({ _id: id }).lean();
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const userId = req.user.id || req.user._id;
    const isAdmin = String(req.user.role || '').toUpperCase() === 'ADMIN' || req.user.email === 'admin@blc.com';
    
    if (String(order.userId) !== String(userId) && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    return res.json({ ...order, id: order._id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error fetching order details' });
  }
};

// Generate PDF Invoice
const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    let order = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).lean();
    }
    if (!order) {
      order = await Order.findOne({ _id: orderId }).lean();
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const userId = req.user.id || req.user._id;
    const isAdmin = String(req.user.role || '').toUpperCase() === 'ADMIN' || req.user.email === 'admin@blc.com';

    if (String(order.userId) !== String(userId) && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to download this invoice' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // BLC Brand Header
    doc.font('Times-Bold').fontSize(22).fillColor('#2e1407').text('bloomluxecollection', { align: 'center' });
    doc.font('Times-Roman').fontSize(9).fillColor('#8a502d').text('PREMIUM LUXURY FASHION & ACCESSORIES', { align: 'center', characterSpacing: 1.5 });
    doc.moveDown(2);

    // Invoice Meta details
    const invoiceY = doc.y;
    const invoiceNo = `INV2026${String(order._id).substring(0, 8).toUpperCase()}`;
    doc.font('Times-Bold').fontSize(14).fillColor('#220f05').text('INVOICE DETAILS');
    doc.font('Times-Roman').fontSize(10).fillColor('#444444');
    doc.text(`Invoice No: ${invoiceNo}`);
    doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`);
    doc.text(`Payment Method: Online Payment (${order.paymentMethod || 'Razorpay'})`);
    doc.text(`Payment Status: ${order.paymentStatus}`);

    // Shipping address details
    doc.font('Times-Bold').fontSize(14).fillColor('#220f05').text('SHIPPING ADDRESS', 320, invoiceY);
    doc.font('Times-Roman').fontSize(10).fillColor('#444444');
    doc.text(order.fullName, 320);
    doc.text(order.address, 320);
    doc.text(`${order.city}, ${order.state} - ${order.zip}`, 320);
    doc.text(`Phone: ${order.mobile}`, 320);
    doc.text(`GSTIN Reference: 07BLOOM2026M1Z2`, 320);
    doc.text(`Store PAN Reference: BLOOMPAN2026M`, 320);

    doc.moveDown(3);
    doc.strokeColor('#eccfb2').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Table Header
    const tableHeaderY = doc.y;
    doc.font('Times-Bold').fontSize(10).fillColor('#2e1407');
    doc.text('Item Description', 50, tableHeaderY, { width: 200 });
    doc.text('HSN', 260, tableHeaderY, { width: 60, align: 'center' });
    doc.text('Price', 320, tableHeaderY, { width: 70, align: 'right' });
    doc.text('Quantity', 395, tableHeaderY, { width: 50, align: 'center' });
    doc.text('Total', 450, tableHeaderY, { width: 100, align: 'right' });

    doc.moveDown(1);
    doc.strokeColor('#f7efe6').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    doc.font('Times-Roman').fontSize(10).fillColor('#220f05');
    (order.items || []).forEach(item => {
      const currentY = doc.y;
      const total = Number(item.price) * Number(item.quantity);
      const title = item.selectedSize ? `${item.name} (Size: ${item.selectedSize})` : item.name;
      doc.text(title, 50, currentY, { width: 200 });
      doc.text('7113', 260, currentY, { width: 60, align: 'center' });
      doc.text(`₹${item.price}`, 320, currentY, { width: 70, align: 'right' });
      doc.text(`${item.quantity}`, 395, currentY, { width: 50, align: 'center' });
      doc.text(`₹${total}`, 450, currentY, { width: 100, align: 'right' });
      doc.moveDown(1.5);
    });

    doc.strokeColor('#eccfb2').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    const calculationsY = doc.y;
    doc.font('Times-Roman').fontSize(10).fillColor('#444444');
    doc.text('Subtotal:', 320, calculationsY);
    
    const sub = (order.items || []).reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    doc.text(`₹${sub}`, 450, calculationsY, { align: 'right' });

    doc.moveDown(0.8);
    const discount = sub - Number(order.totalAmount);
    doc.text(`Discount / Coupon:`, 320, doc.y);
    doc.text(`-₹${Math.max(0, discount).toFixed(2)}`, 450, doc.y, { align: 'right' });

    doc.moveDown(0.8);
    doc.text(`Shipping & Delivery:`, 320, doc.y);
    doc.text('FREE', 450, doc.y, { align: 'right' });

    doc.moveDown(0.8);
    const tax = Number(order.totalAmount) * 0.18;
    doc.text(`GST (18% inclusive):`, 320, doc.y);
    doc.text(`₹${tax.toFixed(2)}`, 450, doc.y, { align: 'right' });

    doc.moveDown(1.2);
    doc.font('Times-Bold').fontSize(12).fillColor('#2e1407').text('Grand Total:', 320, doc.y);
    doc.text(`₹${order.totalAmount}`, 450, doc.y, { align: 'right' });

    try {
      const trackingUrl = `http://localhost:5173/orders/track/${order._id}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackingUrl)}`;
      const qrResponse = await axios.get(qrApiUrl, { responseType: 'arraybuffer' });
      const qrBuffer = Buffer.from(qrResponse.data, 'binary');

      doc.image(qrBuffer, 50, calculationsY, { width: 90 });
      doc.font('Times-Roman').fontSize(8).fillColor('#8a502d').text('Scan to Track Live Status', 50, calculationsY + 98, { width: 90, align: 'center' });
    } catch (qrError) {
      console.error('Failed to include tracking QR code in PDF invoice:', qrError.message);
    }

    doc.font('Times-Italic').fontSize(11).fillColor('#8a502d').text('Thank you for shopping at bloomluxecollection.', 50, doc.y + 40, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF invoice:', error);
    return res.status(500).json({ message: 'Failed to compile and download PDF invoice' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderDetails,
  generateInvoice,
  sendOrderStatusEmail,
  logOrderStatusHistory,
  transitionOrderStatus
};

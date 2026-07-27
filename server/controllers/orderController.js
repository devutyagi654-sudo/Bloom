const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const axios = require('axios');
const Razorpay = require('razorpay');
const { getTableData, insertRow, updateRow, writeTableData } = require('../config/db');

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
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Mail Dispatcher Helper
const sendOrderStatusEmail = async (order, status) => {
  const mailSubjectMap = {
    'Pending': `Bloom Luxe Collection - Order Placed [#BLC-${order.id}]`,
    'Order Confirmed': `Bloom Luxe Collection - Order Confirmed [#BLC-${order.id}]`,
    'Processing': `Bloom Luxe Collection - Order Processing [#BLC-${order.id}]`,
    'Ready to Ship': `Bloom Luxe Collection - Ready to Ship [#BLC-${order.id}]`,
    'Shipped': `Bloom Luxe Collection - Order Shipped [#BLC-${order.id}]`,
    'Out for Delivery': `Bloom Luxe Collection - Out for Delivery [#BLC-${order.id}]`,
    'Delivered': `Bloom Luxe Collection - Order Delivered [#BLC-${order.id}]`,
    'Cancelled': `Bloom Luxe Collection - Order Cancelled [#BLC-${order.id}]`,
    'Return Requested': `Bloom Luxe Collection - Return Requested [#BLC-${order.id}]`,
    'Returned': `Bloom Luxe Collection - Order Returned [#BLC-${order.id}]`,
    'Refunded': `Bloom Luxe Collection - Refund Completed [#BLC-${order.id}]`,
    'Failed': `Bloom Luxe Collection - Payment Failed [#BLC-${order.id}]`
  };

  const subject = mailSubjectMap[status] || `Bloom Luxe Collection - Status Update [#BLC-${order.id}]`;

  const itemDetails = order.items.map(item => 
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #f2e8dc;">${item.name} x ${item.quantity}</td>
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
      <p>Your Bloom Luxe Collection order status has been updated to: <span style="background-color: #eccfb2; padding: 4px 8px; font-weight: bold; border-radius: 4px;">${status}</span></p>

      <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #f7efe6; margin: 20px 0;">
        <h3 style="margin-top: 0; border-bottom: 1px solid #f7efe6; padding-bottom: 8px;">Order Details</h3>
        <p style="margin: 5px 0;"><strong>Order Reference:</strong> #BLC-${order.id}</p>
        <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
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
        <p>© 2026 Bloom Luxe Collection. All rights reserved.</p>
        <p>This is an automated shipping status updates notification system.</p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Bloom Luxe Collection" <${process.env.SMTP_USER}>`,
        to: order.email,
        subject: subject,
        html: htmlContent
      });
      console.log(`Email successfully dispatched to ${order.email} for order #${order.id} status: ${status}`);
    } catch (err) {
      console.error('SMTP Send Error:', err.message);
    }
  } else {
    // Print to Console when running in local sandbox
    console.log(`[SIMULATED EMAIL LOG] to: ${order.email} | Subject: ${subject} | Status: ${status}`);
  }
};

const logOrderStatusHistory = (orderId, prevStatus, newStatus, updatedBy, notes = '') => {
  insertRow('order_status_history.xlsx', {
    orderId: String(orderId),
    prevStatus: prevStatus || '',
    newStatus: newStatus || '',
    updatedBy: updatedBy || 'System',
    notes: notes || '',
    timestamp: new Date().toISOString()
  });
};

const transitionOrderStatus = async (orderId, newStatus, updatedBy = 'System', notes = '') => {
  const orders = getTableData('orders.xlsx');
  const order = orders.find(o => String(o.id) === String(orderId));
  if (!order) return null;

  const prevStatus = order.orderStatus;
  if (prevStatus === newStatus) return order;

  // Update order status in orders.xlsx
  let updatedOrder = updateRow('orders.xlsx', orderId, {
    orderStatus: newStatus
  });

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

  // Insert row in history logs
  logOrderStatusHistory(orderId, prevStatus, newStatus, updatedBy, notes);

  // Send status email notification
  try {
    await sendOrderStatusEmail(updatedOrder, newStatus);
  } catch (err) {
    console.error(`Failed to send status update email for order #${orderId}:`, err.message);
  }

  return updatedOrder;
};

// Create a new order (Supports Cash on Delivery / COD)
const createOrder = async (req, res) => {
  try {
    const {
      fullName, email, mobile, address, city, state, zip,
      paymentMethod, shippingCharges, couponCode
    } = req.body;
    
    if (!fullName || !email || !mobile || !address || !city || !state || !zip || !paymentMethod) {
      return res.status(400).json({ message: 'Please provide all shipping and payment details' });
    }

    if (paymentMethod !== 'COD' && paymentMethod !== 'Razorpay') {
      return res.status(400).json({ message: 'Invalid payment method for direct order endpoint' });
    }
    
    // Fetch cart items
    const carts = getTableData('cart.xlsx');
    const products = getTableData('products.xlsx');
    
    const userCart = carts.filter(item => String(item.userId) === String(req.user.id));
    if (userCart.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }
    
    // Validate stock and build order items list
    const orderItems = [];
    let subtotal = 0;
    
    for (const item of userCart) {
      const product = products.find(p => String(p.id) === String(item.productId));
      if (!product) {
        return res.status(404).json({ message: `Product not found` });
      }
      
      const qty = Number(item.quantity);
      if (Number(product.stock) < qty) {
        return res.status(400).json({ 
          message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}` 
        });
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
    
    // Apply coupon discount
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
    
    const deliveryCharge = paymentMethod === 'COD' ? 50 : 0; // FREE for online prepaid!
    const totalAmount = subtotal - discount + deliveryCharge;
    
    // Deduct stock in products table immediately (to block inventory during checkout retry timeframe)
    for (const item of userCart) {
      const product = products.find(p => String(p.id) === String(item.productId));
      const currentStock = Number(product.stock);
      updateRow('products.xlsx', product.id, {
        stock: currentStock - Number(item.quantity)
      });
    }
    
    if (paymentMethod === 'Razorpay') {
      // Generate Razorpay Order
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

      // Create Failed order draft to be retried
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
        paymentStatus: 'Failed', // Failed until verified
        totalAmount: Number(totalAmount.toFixed(2)),
        shippingCharges: 0,
        deliveryCharge: 0,
        couponCode: couponCode || '',
        items: orderItems,
        orderStatus: 'Pending', // Pending payment
        razorpayOrderId: rzOrderId,
        razorpayPaymentId: '',
        razorpaySignature: '',
        shipmentId: '',
        trackingId: '',
        awbCode: '',
        courierName: '',
        trackingUrl: '',
        expectedDelivery: ''
      });

      logOrderStatusHistory(order.id, '', 'Pending', 'System', 'Order draft created (prepaid payment pending)');

      // Return draft with mockMode indicator for frontend loading dialog
      return res.status(201).json({
        ...order,
        mockMode,
        amount: amountInPaise,
        currency: 'INR'
      });
    }

    // COD Direct Placement
    const order = insertRow('orders.xlsx', {
      userId: req.user.id,
      fullName,
      email: email.toLowerCase(),
      mobile,
      address,
      city,
      state,
      zip,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      totalAmount: Number(totalAmount.toFixed(2)),
      shippingCharges: deliveryCharge,
      deliveryCharge: deliveryCharge,
      couponCode: couponCode || '',
      items: orderItems,
      orderStatus: 'Pending', // Every new order starts with Pending
      razorpayOrderId: '',
      razorpayPaymentId: '',
      razorpaySignature: '',
      shipmentId: '',
      trackingId: '',
      awbCode: '',
      courierName: '',
      trackingUrl: '',
      expectedDelivery: ''
    });
    
    // Clear user's cart
    const remainingCarts = carts.filter(item => String(item.userId) !== String(req.user.id));
    writeTableData('cart.xlsx', remainingCarts);

    // Log the initial status to history
    logOrderStatusHistory(order.id, '', 'Pending', 'System', 'Order placed successfully (Cash on Delivery)');

    // Trigger confirmation email for Pending status
    try {
      await sendOrderStatusEmail(order, 'Pending');
    } catch (emailErr) {
      console.error('Order notification email failed:', emailErr.message);
    }
    
    return res.status(201).json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error placing order' });
  }
};

// Get orders of logged-in user
const getMyOrders = async (req, res) => {
  try {
    const orders = getTableData('orders.xlsx');
    const userOrders = orders.filter(o => String(o.userId) === String(req.user.id));
    
    // Sort orders by newest first
    userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return res.json(userOrders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving orders' });
  }
};

// Get single order details
const getOrderDetails = async (req, res) => {
  try {
    const orders = getTableData('orders.xlsx');
    const order = orders.find(o => String(o.id) === String(req.params.id));
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only allow owner or admin to see order details
    if (String(order.userId) !== String(req.user.id) && req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error fetching order details' });
  }
};

// Generate PDF Invoice
const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = getTableData('orders.xlsx');
    const order = orders.find(o => String(o.id) === String(orderId));

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization check
    if (String(order.userId) !== String(req.user.id) && req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to download this invoice' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.id}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // BLC Brand Header
    doc.font('Times-Bold').fontSize(22).fillColor('#2e1407').text('BLOOM LUXE COLLECTION', { align: 'center' });
    doc.font('Times-Roman').fontSize(9).fillColor('#8a502d').text('PREMIUM LUXURY FASHION & ACCESSORIES', { align: 'center', characterSpacing: 1.5 });
    doc.moveDown(2);

    // Invoice Meta details
    const invoiceY = doc.y;
    const invoiceNo = `INV2026${String(order.id).padStart(4, '0')}`;
    doc.font('Times-Bold').fontSize(14).fillColor('#220f05').text('INVOICE DETAILS');
    doc.font('Times-Roman').fontSize(10).fillColor('#444444');
    doc.text(`Invoice No: ${invoiceNo}`);
    doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);

    // Shipping address details aligned to the right
    doc.font('Times-Bold').fontSize(14).fillColor('#220f05').text('SHIPPING ADDRESS', 320, invoiceY);
    doc.font('Times-Roman').fontSize(10).fillColor('#444444');
    doc.text(order.fullName, 320);
    doc.text(order.address, 320);
    doc.text(`${order.city}, ${order.state} - ${order.zip}`, 320);
    doc.text(`Phone: ${order.mobile}`, 320);
    doc.text(`GSTIN Reference: 07BLOOM2026M1Z2`, 320);
    doc.text(`Store PAN Reference: BLOOMPAN2026M`, 320);

    // Render separator line
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

    // Itemized table rows
    doc.font('Times-Roman').fontSize(10).fillColor('#220f05');
    order.items.forEach(item => {
      const currentY = doc.y;
      const total = Number(item.price) * Number(item.quantity);
      doc.text(item.name, 50, currentY, { width: 200 });
      doc.text('7113', 260, currentY, { width: 60, align: 'center' }); // HSN: 7113 for gold/precious jewelry
      doc.text(`₹${item.price}`, 320, currentY, { width: 70, align: 'right' });
      doc.text(`${item.quantity}`, 395, currentY, { width: 50, align: 'center' });
      doc.text(`₹${total}`, 450, currentY, { width: 100, align: 'right' });
      doc.moveDown(1.5);
    });

    // If COD, show delivery charges as an item row
    if (Number(order.deliveryCharge) > 0) {
      const currentY = doc.y;
      doc.text('Cash Collection & Shipping Charges', 50, currentY, { width: 200 });
      doc.text('9968', 260, currentY, { width: 60, align: 'center' }); // SAC: 9968 for logistics/postal
      doc.text(`₹${order.deliveryCharge}`, 320, currentY, { width: 70, align: 'right' });
      doc.text('1', 395, currentY, { width: 50, align: 'center' });
      doc.text(`₹${order.deliveryCharge}`, 450, currentY, { width: 100, align: 'right' });
      doc.moveDown(1.5);
    }

    doc.strokeColor('#eccfb2').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Calculations
    const calculationsY = doc.y;
    doc.font('Times-Roman').fontSize(10).fillColor('#444444');
    doc.text('Subtotal:', 320, calculationsY);
    
    // Calculate subtotal from items
    const sub = order.items.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    doc.text(`₹${sub}`, 450, calculationsY, { align: 'right' });

    // Discount if any
    doc.moveDown(0.8);
    const discount = sub - Number(order.totalAmount) + Number(order.deliveryCharge);
    doc.text(`Discount / Coupon:`, 320, doc.y);
    doc.text(`-₹${discount.toFixed(2)}`, 450, doc.y, { align: 'right' });

    // Delivery charges
    doc.moveDown(0.8);
    doc.text(`Shipping & Delivery:`, 320, doc.y);
    doc.text(Number(order.deliveryCharge) > 0 ? `₹${order.deliveryCharge}` : 'FREE', 450, doc.y, { align: 'right' });

    // GST Tax
    doc.moveDown(0.8);
    const tax = Number(order.totalAmount) * 0.18; // 18% inclusive GST
    doc.text(`GST (18% inclusive):`, 320, doc.y);
    doc.text(`₹${tax.toFixed(2)}`, 450, doc.y, { align: 'right' });

    // Grand total
    doc.moveDown(1.2);
    doc.font('Times-Bold').fontSize(12).fillColor('#2e1407').text('Grand Total:', 320, doc.y);
    doc.text(`₹${order.totalAmount}`, 450, doc.y, { align: 'right' });

    // Render QR Code image for order tracking live
    try {
      const trackingUrl = `http://localhost:5173/orders/track/${order.id}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackingUrl)}`;
      const qrResponse = await axios.get(qrApiUrl, { responseType: 'arraybuffer' });
      const qrBuffer = Buffer.from(qrResponse.data, 'binary');

      // Place QR code bottom left
      doc.image(qrBuffer, 50, calculationsY, { width: 90 });
      doc.font('Times-Roman').fontSize(8).fillColor('#8a502d').text('Scan to Track Live Status', 50, calculationsY + 98, { width: 90, align: 'center' });
    } catch (qrError) {
      console.error('Failed to include tracking QR code in PDF invoice:', qrError.message);
    }

    // Thank you message footer
    doc.font('Times-Italic').fontSize(11).fillColor('#8a502d').text('Thank you for shopping at Bloom Luxe Collection.', 50, doc.y + 40, { align: 'center' });

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

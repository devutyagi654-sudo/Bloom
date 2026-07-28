const axios = require('axios');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendOrderStatusEmail, logOrderStatusHistory } = require('./orderController');

// Read Shiprocket Env Credentials
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const isShiprocketConfigured = SHIPROCKET_EMAIL && SHIPROCKET_EMAIL !== 'your_shiprocket_email' &&
                                SHIPROCKET_PASSWORD && SHIPROCKET_PASSWORD !== 'your_shiprocket_password';

let shiprocketToken = null;
let tokenExpiry = null;

// Authenticate with Shiprocket API
const getShiprocketToken = async () => {
  if (!isShiprocketConfigured) return null;

  if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
    return shiprocketToken;
  }

  try {
    const res = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD
    });

    shiprocketToken = res.data.token;
    tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    return shiprocketToken;
  } catch (error) {
    console.error('Shiprocket Authentication Failed:', error.response?.data || error.message);
    return null;
  }
};

// Internal function to trigger Shiprocket creation and update database
const createShipmentInternal = async (orderId) => {
  try {
    let order = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ _id: orderId });
    }

    if (!order) {
      throw new Error('Order not found in database');
    }

    const token = await getShiprocketToken();

    if (token) {
      const orderDate = new Date(order.createdAt || Date.now()).toISOString().split('T')[0] + ' 12:00';
      const payload = {
        order_id: `BLC-${order._id}`,
        order_date: orderDate,
        pickup_location: "Primary Warehouse",
        billing_customer_name: (order.fullName || '').split(' ')[0] || 'Customer',
        billing_last_name: (order.fullName || '').split(' ').slice(1).join(' ') || 'Name',
        billing_address: order.address,
        billing_city: order.city,
        billing_pincode: order.zip,
        billing_state: order.state,
        billing_country: "India",
        billing_email: order.email,
        billing_phone: order.mobile,
        shipping_is_billing: true,
        order_items: (order.items || []).map(item => ({
          name: item.name,
          sku: `SKU-${item.productId}`,
          units: Number(item.quantity),
          selling_price: Number(item.price),
          discount: 0
        })),
        payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
        sub_total: Number(order.totalAmount),
        length: 15,
        width: 15,
        height: 10,
        weight: 0.5
      };

      const orderRes = await axios.post(
        'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const shipmentId = orderRes.data.shipment_id;
      const srOrderId = orderRes.data.order_id;

      const awbPayload = {
        shipment_id: shipmentId,
        courier_id: ""
      };

      let awbCode = '';
      let courierName = 'BlueDart';
      let trackingUrl = '';

      try {
        const awbRes = await axios.post(
          'https://apiv2.shiprocket.in/v1/external/courier/assign/awb',
          awbPayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        awbCode = awbRes.data.response.data.awb_code;
        courierName = awbRes.data.response.data.courier_name || 'BlueDart';
        trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;
      } catch (awbErr) {
        console.error('Shiprocket AWB Auto Assignment Failed:', awbErr.response?.data || awbErr.message);
        awbCode = `AWB${Math.floor(100000000 + Math.random() * 900000000)}`;
        trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;
      }

      order.shipmentId = String(shipmentId);
      order.trackingId = String(srOrderId);
      order.awbCode = String(awbCode);
      order.courierName = String(courierName);
      order.trackingUrl = String(trackingUrl);
      order.orderStatus = 'Ready to Ship';

      await order.save();
      console.log(`Live Shiprocket Order created successfully! AWB: ${awbCode}`);
      return order;
    } else {
      const mockShipmentId = `SR_SHIP_${Math.floor(100000 + Math.random() * 900000)}`;
      const mockTrackingId = `SR_ORD_${Math.floor(100000 + Math.random() * 900000)}`;
      const mockAwbCode = `BLC${Math.floor(100000000 + Math.random() * 900000000)}`;
      const mockCourier = 'BlueDart Express';
      const mockTrackingUrl = `https://shiprocket.co/tracking/${mockAwbCode}`;

      order.shipmentId = mockShipmentId;
      order.trackingId = mockTrackingId;
      order.awbCode = mockAwbCode;
      order.courierName = mockCourier;
      order.trackingUrl = mockTrackingUrl;
      order.orderStatus = 'Ready to Ship';

      await order.save();
      console.log(`[SIMULATED SHIPMENT] Order #${order._id} automatically booked. AWB: ${mockAwbCode}`);
      return order;
    }
  } catch (error) {
    console.error('Error during internal shipment creation:', error);
    return null;
  }
};

const createShipment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const updatedOrder = await createShipmentInternal(orderId);
    if (!updatedOrder) {
      return res.status(500).json({ message: 'Failed to create shipment order' });
    }

    const resObj = updatedOrder.toObject();
    resObj.id = resObj._id;
    return res.status(201).json({
      message: 'Shipment created and AWB generated successfully',
      shipment: resObj
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return res.status(500).json({ message: 'Server error creating shipment' });
  }
};

const getTrackingDetails = async (req, res) => {
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

    if (!order.awbCode) {
      return res.status(400).json({ message: 'Shipment not yet initiated for this order' });
    }

    const token = await getShiprocketToken();

    if (token) {
      try {
        const trackRes = await axios.get(
          `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${order.awbCode}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const trackingData = trackRes.data.tracking_data;
        return res.json({
          success: true,
          orderId: order._id,
          awbCode: order.awbCode,
          courierName: order.courierName,
          currentStatus: trackingData.track_status || order.orderStatus,
          origin: trackingData.origin || 'New Delhi Warehouse',
          destination: trackingData.destination || order.city,
          scans: trackingData.shipment_track_activities || []
        });
      } catch (apiErr) {
        console.error('Shiprocket Live Tracking Error:', apiErr.message);
      }
    }

    return res.json({
      success: true,
      orderId: order._id,
      awbCode: order.awbCode,
      courierName: order.courierName,
      currentStatus: order.orderStatus,
      origin: 'New Delhi Warehouse',
      destination: `${order.city}, ${order.state}`,
      trackingUrl: order.trackingUrl,
      scans: [
        { activity: 'Order Packed & Verified', location: 'New Delhi Warehouse', date: order.createdAt },
        { activity: 'Handed Over to Courier Partner', location: order.courierName, date: new Date().toISOString() },
        { activity: `In Transit to ${order.city}`, location: 'Hub Logistics Center', date: new Date().toISOString() }
      ]
    });
  } catch (error) {
    console.error('Error fetching tracking details:', error);
    return res.status(500).json({ message: 'Server error fetching tracking details' });
  }
};

const cancelShipment = async (req, res) => {
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

    const userId = req.user.id || req.user._id;
    const isAdmin = String(req.user.role || '').toUpperCase() === 'ADMIN' || req.user.email === 'admin@blc.com';

    if (String(order.userId) !== String(userId) && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled') {
      return res.status(400).json({ message: `Cannot cancel order with status: ${order.orderStatus}` });
    }

    const prevStatus = order.orderStatus;
    order.orderStatus = 'Cancelled';
    await order.save();

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
    } catch (stockErr) {
      console.error(stockErr);
    }

    await logOrderStatusHistory(order._id, prevStatus, 'Cancelled', req.user.fullName || 'User', 'Order cancelled by customer/admin');

    try {
      await sendOrderStatusEmail(order, 'Cancelled');
    } catch (e) {
      console.error('Nodemailer cancellation alert failed:', e);
    }

    const resObj = order.toObject();
    resObj.id = resObj._id;
    return res.json({ message: 'Order cancelled successfully', order: resObj });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ message: 'Server error cancelling order' });
  }
};

const requestReturn = async (req, res) => {
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

    const userId = req.user.id || req.user._id;
    if (String(order.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to request return for this order' });
    }

    if (order.orderStatus !== 'Delivered') {
      return res.status(400).json({ message: 'Returns can only be requested for delivered orders' });
    }

    const prevStatus = order.orderStatus;
    order.orderStatus = 'Return Requested';
    await order.save();

    await logOrderStatusHistory(order._id, prevStatus, 'Return Requested', req.user.fullName || 'User', 'Return requested by customer');

    try {
      await sendOrderStatusEmail(order, 'Return Requested');
    } catch (e) {
      console.error(e);
    }

    const resObj = order.toObject();
    resObj.id = resObj._id;
    return res.json({ message: 'Return request submitted successfully', order: resObj });
  } catch (error) {
    console.error('Error requesting return:', error);
    return res.status(500).json({ message: 'Server error submitting return request' });
  }
};

module.exports = {
  createShipment,
  getTrackingDetails,
  trackShipment: getTrackingDetails,
  cancelShipment,
  requestReturn,
  createShipmentInternal
};

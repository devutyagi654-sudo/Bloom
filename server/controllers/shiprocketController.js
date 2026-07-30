const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { createShiprocketOrder, trackShiprocketOrder, cancelShiprocketOrder } = require('../services/shiprocketService');
const { sendOrderStatusEmail, logOrderStatusHistory } = require('./orderController');

/**
 * Endpoint for manually triggering shipment creation (Admin Action or API)
 */
const createShipment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const updatedOrder = await createShiprocketOrder(orderId);
    if (!updatedOrder) {
      return res.status(500).json({ message: 'Failed to push order to Shiprocket portal' });
    }

    const resObj = updatedOrder.toObject ? updatedOrder.toObject() : updatedOrder;
    resObj.id = resObj._id;
    return res.status(201).json({
      message: 'Shipment order successfully pushed to Shiprocket',
      shipment: resObj
    });
  } catch (error) {
    console.error('Error in createShipment controller:', error);
    return res.status(500).json({ message: 'Server error creating shipment' });
  }
};

/**
 * Endpoint for fetching live order tracking details
 */
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
      return res.status(200).json({
        success: true,
        trackingInitiated: false,
        orderId: order._id,
        awbCode: null,
        courierName: order.courierName || 'BLC Logistics',
        currentStatus: order.orderStatus || 'Order Confirmed',
        origin: 'C-242, Harsh Vihar, Hari Nagar, Jaitpur, Badarpur, New Delhi – 110044',
        destination: `${order.city}, ${order.state}`,
        trackingUrl: order.trackingUrl || '',
        milestones: [
          { activity: 'Order Confirmed & Payment Verified', location: 'New Delhi Fulfilment Hub', date: order.createdAt }
        ],
        scans: [
          { activity: 'Order Confirmed & Payment Verified', location: 'New Delhi Fulfilment Hub', date: order.createdAt }
        ]
      });
    }

    const liveTrackingData = await trackShiprocketOrder(order.awbCode);

    if (liveTrackingData) {
      const scansArr = liveTrackingData.shipment_track_activities || [];
      return res.json({
        success: true,
        trackingInitiated: true,
        orderId: order._id,
        awbCode: order.awbCode,
        courierName: order.courierName,
        currentStatus: liveTrackingData.track_status || order.orderStatus,
        origin: liveTrackingData.origin || 'C-242, Harsh Vihar, Hari Nagar, Jaitpur, Badarpur, New Delhi – 110044',
        destination: liveTrackingData.destination || `${order.city}, ${order.state}`,
        milestones: scansArr,
        scans: scansArr
      });
    }

    // Fallback simulated tracking log
    const fallbackScans = [
      { activity: 'Order Packed & Verified', location: 'C-242, Harsh Vihar, Hari Nagar, Jaitpur, Badarpur, New Delhi – 110044', date: order.createdAt },
      { activity: 'Handed Over to Courier Partner', location: order.courierName || 'BlueDart', date: new Date().toISOString() },
      { activity: `In Transit to ${order.city}`, location: 'Logistics Center', date: new Date().toISOString() }
    ];

    return res.json({
      success: true,
      trackingInitiated: true,
      orderId: order._id,
      awbCode: order.awbCode,
      courierName: order.courierName,
      currentStatus: order.orderStatus,
      origin: 'C-242, Harsh Vihar, Hari Nagar, Jaitpur, Badarpur, New Delhi – 110044',
      destination: `${order.city}, ${order.state}`,
      trackingUrl: order.trackingUrl,
      milestones: fallbackScans,
      scans: fallbackScans
    });
  } catch (error) {
    console.error('Error fetching tracking details:', error);
    return res.status(500).json({ message: 'Server error fetching tracking details' });
  }
};

/**
 * Endpoint for cancelling shipment & order
 */
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

    // Cancel on Shiprocket if shipmentId exists
    if (order.shipmentId && !order.shipmentId.startsWith('SR_SHIP_')) {
      await cancelShiprocketOrder(order.shipmentId);
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
    } catch (stockErr) {
      console.error('Stock revert error:', stockErr);
    }

    await logOrderStatusHistory(order._id, prevStatus, 'Cancelled', req.user.fullName || 'User', 'Order cancelled by customer/admin');

    try {
      await sendOrderStatusEmail(order, 'Cancelled');
    } catch (e) {
      console.error('Cancellation email notification failed:', e);
    }

    const resObj = order.toObject ? order.toObject() : order;
    resObj.id = resObj._id;
    return res.json({ message: 'Order cancelled successfully', order: resObj });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ message: 'Server error cancelling order' });
  }
};

/**
 * Endpoint for requesting customer order return
 */
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
      console.error('Return email notification error:', e);
    }

    const resObj = order.toObject ? order.toObject() : order;
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
  requestReturn
};

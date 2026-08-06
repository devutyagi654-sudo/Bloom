const axios = require('axios');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { getShiprocketToken, isShiprocketConfigured } = require('../utils/shiprocketToken');

/**
 * Automatically pushes an order (COD or Prepaid) to Shiprocket API v1.
 * Validates payload, handles authentication, prevents duplicates, and updates MongoDB.
 * @param {string|Object} orderIdOrDoc Mongo Order ID or Order Document
 * @returns {Promise<Object|null>} Updated Order Document or null on failure
 */
const createShiprocketOrder = async (orderIdOrDoc) => {
  console.log('==================================================');
  console.log('[SHIPROCKET_ORDER_CREATION] Starting Shiprocket Order Dispatch Flow...');

  try {
    let order = null;

    if (typeof orderIdOrDoc === 'string' || mongoose.Types.ObjectId.isValid(orderIdOrDoc)) {
      order = await Order.findById(orderIdOrDoc);
      if (!order) {
        order = await Order.findOne({ _id: orderIdOrDoc });
      }
    } else if (orderIdOrDoc && orderIdOrDoc._id) {
      order = orderIdOrDoc;
    }

    if (!order) {
      console.error('[SHIPROCKET_ERROR] Order document not found in MongoDB for ID:', orderIdOrDoc);
      return null;
    }

    console.log(`[SHIPROCKET] Order Found: #${order._id} | Payment Method: ${order.paymentMethod} | Payment Status: ${order.paymentStatus} | Order Status: ${order.orderStatus}`);

    // 1. Validate payment status: Allow Paid orders and COD orders (skip Cancelled/Failed)
    const isCOD = String(order.paymentMethod || '').toUpperCase() === 'COD' || String(order.paymentMethod || '').toLowerCase() === 'cash on delivery';
    const isPaidOrCOD = order.paymentStatus === 'Paid' || isCOD;
    const isNotCancelled = order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Failed';

    if (!isPaidOrCOD || !isNotCancelled) {
      console.warn(`[SHIPROCKET_WARN] Skipping order #${order._id}. Payment status: ${order.paymentStatus}, Order status: ${order.orderStatus}`);
      return null;
    }

    // 2. Prevent Duplicate Push: Check if shipment already exists on Shiprocket
    if (order.shipmentId && order.trackingId && !order.shipmentId.startsWith('SR_SHIP_')) {
      console.log(`[SHIPROCKET_INFO] Order #${order._id} has already been pushed to Shiprocket. Shipment ID: ${order.shipmentId}`);
      return order;
    }

    // 3. Obtain Bearer Token from Shiprocket API
    const token = await getShiprocketToken();

    if (!token) {
      console.error(`[SHIPROCKET_AUTH_FAILURE] Unable to push Order #${order._id} because Shiprocket authentication failed or credentials are unconfigured.`);
      return null;
    }

    // 4. Customer Name Formatting
    const nameParts = (order.fullName || 'Valued Customer').trim().split(' ');
    const firstName = nameParts[0] || 'Valued';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    // 5. Order Date Formatting: YYYY-MM-DD HH:mm
    const orderDateObj = new Date(order.createdAt || Date.now());
    const dateStr = orderDateObj.toISOString().split('T')[0];
    const timeStr = orderDateObj.toTimeString().substring(0, 5);
    const formattedOrderDate = `${dateStr} ${timeStr}`;

    // 6. Map Order Items compliant with Shiprocket API v1
    const orderItems = (order.items || []).map((item, idx) => ({
      name: String(item.name || 'Luxury Jewelry Piece').substring(0, 100),
      sku: String(item.productId ? `SKU-${item.productId}` : `SKU-ITEM-${idx + 1}`),
      units: Number(item.quantity || 1),
      selling_price: Number(item.price || 0),
      discount: 0,
      tax: 0,
      hsn: 7113
    }));

    // 7. Clean Phone Number for Shiprocket (10-digit strict format)
    let cleanPhone = String(order.mobile || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (cleanPhone.length !== 10) {
      cleanPhone = '9999999999';
    }

    const pickupLocation = (process.env.SHIPROCKET_PICKUP_LOCATION || "Home").trim();
    const isCodPayment = isCOD ? "COD" : "Prepaid";

    // 8. Official Shiprocket Adhoc Order Creation Payload
    const payload = {
      order_id: `BLC-${order._id}`,
      order_date: formattedOrderDate,
      pickup_location: pickupLocation,
      channel_id: "",
      comment: "Bloom Luxe Collection Luxury Jewelry Order",
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: order.address || 'Address details',
      billing_address_2: "",
      billing_city: order.city || 'Delhi',
      billing_pincode: String(order.zip || '110044'),
      billing_state: order.state || 'Delhi',
      billing_country: "India",
      billing_email: order.email || 'customer@example.com',
      billing_phone: cleanPhone,
      shipping_is_billing: true,
      shipping_customer_name: firstName,
      shipping_last_name: lastName,
      shipping_address: order.address || 'Address details',
      shipping_address_2: "",
      shipping_city: order.city || 'Delhi',
      shipping_pincode: String(order.zip || '110044'),
      shipping_state: order.state || 'Delhi',
      shipping_country: "India",
      shipping_email: order.email || 'customer@example.com',
      shipping_phone: cleanPhone,
      order_items: orderItems,
      payment_method: isCodPayment,
      shipping_charges: Number(order.shippingCharges || 0),
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: Number(order.totalAmount || 0),
      length: 15,
      breadth: 15,
      height: 10,
      weight: 0.5
    };

    console.log(`[SHIPROCKET_ORDER_PAYLOAD] Generated payload for Order #BLC-${order._id}:\n`, JSON.stringify(payload, null, 2));

    // 9. Post Order Creation to Shiprocket API
    const orderRes = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(`[SHIPROCKET_API_RESPONSE] HTTP Status: ${orderRes.status}`);
    console.log(`[SHIPROCKET_API_RESPONSE] Body:\n`, JSON.stringify(orderRes.data, null, 2));

    // 10. Hidden Error Detection in Response
    if (orderRes.data && (orderRes.data.status_code === 0 || orderRes.data.status === 'error')) {
      console.error('[SHIPROCKET_HIDDEN_ERROR] Shiprocket API rejected order creation:', orderRes.data.message || orderRes.data);
      return null;
    }

    const shipmentId = orderRes.data.shipment_id;
    const srOrderId = orderRes.data.order_id;

    if (!shipmentId && !srOrderId) {
      console.error('[SHIPROCKET_ERROR] Response missing shipment_id or order_id:', orderRes.data);
      return null;
    }

    // 11. Auto Assign AWB Courier
    let awbCode = '';
    let courierName = 'BlueDart';
    let trackingUrl = '';

    try {
      console.log(`[SHIPROCKET_AWB] Requesting AWB Assignment for Shipment ID: ${shipmentId}...`);
      const awbRes = await axios.post(
        'https://apiv2.shiprocket.in/v1/external/courier/assign/awb',
        { shipment_id: shipmentId, courier_id: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('[SHIPROCKET_AWB_RESPONSE]:', JSON.stringify(awbRes.data, null, 2));

      if (awbRes.data && awbRes.data.response && awbRes.data.response.data) {
        const awbData = awbRes.data.response.data;
        awbCode = awbData.awb_code || '';
        courierName = awbData.courier_name || 'BlueDart';
        trackingUrl = awbCode ? `https://shiprocket.co/tracking/${awbCode}` : '';
      }
    } catch (awbErr) {
      console.error('[SHIPROCKET_AWB_WARN] Auto AWB assignment pending:', awbErr.response?.data?.message || awbErr.message);
    }

    // 12. Save Shiprocket Details into MongoDB Order Document
    order.shipmentId = String(shipmentId || '');
    order.trackingId = String(srOrderId || '');
    if (awbCode) order.awbCode = String(awbCode);
    if (courierName) order.courierName = String(courierName);
    if (trackingUrl) order.trackingUrl = String(trackingUrl);
    order.orderStatus = 'Ready to Ship';

    await order.save();
    console.log(`[SHIPROCKET_SUCCESS] Order #BLC-${order._id} successfully pushed to Shiprocket! Shipment ID: ${shipmentId}, Order ID: ${srOrderId}, AWB: ${awbCode || 'Pending Assignment'}`);
    console.log('==================================================');
    return order;

  } catch (error) {
    console.error('==================================================');
    console.error('[SHIPROCKET_ERROR_RESPONSE] Failed to push order to Shiprocket API:');
    console.error('Error Message:', error.message);
    if (error.response) {
      console.error('HTTP Status Code:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('==================================================');
    return null;
  }
};

/**
 * Fetches live shipment tracking data from Shiprocket.
 * @param {string} awbCode Courier AWB tracking number
 * @returns {Promise<Object|null>} Tracking data payload
 */
const trackShiprocketOrder = async (awbCode) => {
  if (!awbCode) return null;
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const res = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.tracking_data || null;
  } catch (error) {
    console.error('[SHIPROCKET_TRACKING_ERROR]:', error.response?.data || error.message);
    return null;
  }
};

/**
 * Cancels shipment order on Shiprocket.
 * @param {string} shipmentId Shiprocket Shipment ID
 * @returns {Promise<boolean>} Success flag
 */
const cancelShiprocketOrder = async (shipmentId) => {
  if (!shipmentId) return false;
  const token = await getShiprocketToken();
  if (!token) return false;

  try {
    await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/cancel',
      { ids: [shipmentId] },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`[SHIPROCKET] Shipment ID ${shipmentId} cancelled on Shiprocket portal.`);
    return true;
  } catch (error) {
    console.error('[SHIPROCKET_CANCEL_ERROR]:', error.response?.data || error.message);
    return false;
  }
};

module.exports = {
  createShiprocketOrder,
  trackShiprocketOrder,
  cancelShiprocketOrder
};

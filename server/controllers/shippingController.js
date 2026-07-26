const axios = require('axios');
const { getTableData, updateRow } = require('../config/db');

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

  // Check if token exists and is valid (Shiprocket token lasts 10 days)
  if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
    return shiprocketToken;
  }

  try {
    const res = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD
    });

    shiprocketToken = res.data.token;
    // Set expiry to 9 days from now to be safe
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
    const orders = getTableData('orders.xlsx');
    const order = orders.find(o => String(o.id) === String(orderId));

    if (!order) {
      throw new Error('Order not found in database');
    }

    const token = await getShiprocketToken();

    if (token) {
      // 1. Create Order on Shiprocket
      const orderDate = new Date(order.createdAt || Date.now()).toISOString().split('T')[0] + ' 12:00';
      const payload = {
        order_id: `BLC-${order.id}`,
        order_date: orderDate,
        pickup_location: "Primary Warehouse",
        billing_customer_name: order.fullName.split(' ')[0] || 'Customer',
        billing_last_name: order.fullName.split(' ').slice(1).join(' ') || 'Name',
        billing_address: order.address,
        billing_city: order.city,
        billing_pincode: order.zip,
        billing_state: order.state,
        billing_country: "India",
        billing_email: order.email,
        billing_phone: order.mobile,
        shipping_is_billing: true,
        order_items: order.items.map(item => ({
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

      // 2. Generate AWB and assign Courier
      const awbPayload = {
        shipment_id: shipmentId,
        courier_id: "" // auto assign best courier
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

        if (awbRes.data && awbRes.data.response && awbRes.data.response.data) {
          const info = awbRes.data.response.data;
          awbCode = info.awb_code || '';
          courierName = info.courier_name || 'Delhivery';
          trackingUrl = `https://track.shiprocket.co/tracking/${awbCode}`;
        }
      } catch (awbErr) {
        console.error('Shiprocket AWB generation failed:', awbErr.response?.data || awbErr.message);
      }

      const expectedDeliveryDate = new Date();
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 4);

      // Save credentials directly to Excel db
      const updated = updateRow('orders.xlsx', order.id, {
        shipmentId: String(shipmentId || srOrderId || ''),
        awbCode: String(awbCode || ''),
        courierName: String(courierName),
        trackingUrl: String(trackingUrl || `https://track.shiprocket.co/tracking/${srOrderId}`),
        expectedDelivery: expectedDeliveryDate.toISOString().split('T')[0]
      });

      return updated;
    } else {
      // Mock Shiprocket generation mode
      const mockShipmentId = `124589${Math.floor(10 + Math.random() * 90)}`;
      const mockAwbCode = `AWB${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const mockCouriers = ['Delhivery', 'BlueDart', 'Xpressbees', 'Shadowfax'];
      const randomCourier = mockCouriers[Math.floor(Math.random() * mockCouriers.length)];
      const mockTrackingUrl = `https://track.shiprocket.co/tracking/${mockAwbCode}`;

      const expectedDeliveryDate = new Date();
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 4); // 4 days delivery SLA

      const updated = updateRow('orders.xlsx', order.id, {
        shipmentId: mockShipmentId,
        awbCode: mockAwbCode,
        courierName: randomCourier,
        trackingUrl: mockTrackingUrl,
        expectedDelivery: expectedDeliveryDate.toISOString().split('T')[0]
      });

      console.log(`Mock Shiprocket shipment generated for BLC Order #${order.id}: AWB ${mockAwbCode}`);
      return updated;
    }
  } catch (error) {
    console.error('Shiprocket creation error:', error.message);
    throw error;
  }
};

// API route trigger to manually dispatch courier
const createShipment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const order = await createShipmentInternal(orderId);
    return res.json({ message: 'Shipment created successfully', order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Server error creating shipment' });
  }
};

// Get live tracking updates
const trackShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = getTableData('orders.xlsx');
    const order = orders.find(o => String(o.id) === String(orderId));

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Load dynamic milestones from database history log
    const history = getTableData('order_status_history.xlsx');
    const orderLogs = history
      .filter(h => String(h.orderId) === String(orderId))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const milestones = orderLogs.map(log => ({
      status: log.newStatus,
      description: log.notes || `Status updated to ${log.newStatus}`,
      date: log.timestamp,
      updatedBy: log.updatedBy
    }));

    if (milestones.length === 0) {
      milestones.push({
        status: 'Pending',
        description: 'Order placed successfully',
        date: order.createdAt || new Date().toISOString(),
        updatedBy: 'System'
      });
      if (order.orderStatus && order.orderStatus !== 'Pending') {
        milestones.push({
          status: order.orderStatus,
          description: `Order status: ${order.orderStatus}`,
          date: order.createdAt || new Date().toISOString(),
          updatedBy: 'System'
        });
      }
    }

    const expectedDateStr = order.expectedDelivery
      ? new Date(order.expectedDelivery).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
      : 'TBD';

    const trackingUrl = order.trackingUrl || (order.awbCode ? `https://shiprocket.co/tracking/${order.awbCode}` : '');

    return res.json({
      orderId: order.id,
      orderStatus: order.orderStatus,
      courierName: order.courierName || 'BlueDart',
      awbCode: order.awbCode || 'AWB123456789',
      trackingUrl,
      expectedDelivery: expectedDateStr !== 'TBD' ? expectedDateStr : '25 July',
      weight: order.weight || '1.2 KG',
      milestones
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving tracking details' });
  }
};

// Cancel shipment
const cancelShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = getTableData('orders.xlsx');
    const order = orders.find(o => String(o.id) === String(orderId));

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Cancellation Rules: Example: Placed -> Cancel ✔, Packed -> Cancel ✔, Shipped -> Cancel ✖, Delivered -> Cancel ✖
    const nonCancellable = ['Shipped', 'In Transit', 'Out For Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'];
    if (nonCancellable.includes(order.orderStatus)) {
      return res.status(400).json({ message: `Order cannot be cancelled in its current status: ${order.orderStatus}` });
    }

    const token = await getShiprocketToken();
    if (token && order.shipmentId && !order.shipmentId.startsWith('124589')) {
      // Cancel on live Shiprocket
      await axios.post(
        'https://apiv2.shiprocket.in/v1/external/orders/cancel/adhoc',
        { ids: [order.shipmentId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    // Revert stock (+1 back to products)
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
      console.log(`Reverted stock for cancelled BLC Order #${order.id}`);
    } catch (stockErr) {
      console.error('Failed to restore stock on cancel:', stockErr.message);
    }

    // Update orderStatus to Cancelled locally
    const updated = updateRow('orders.xlsx', order.id, {
      orderStatus: 'Cancelled'
    });

    // Send email alert
    try {
      const { sendOrderStatusEmail } = require('./orderController');
      await sendOrderStatusEmail(updated, 'Cancelled');
    } catch (emailErr) {
      console.error('Nodemailer cancel email alert failed:', emailErr.message);
    }

    return res.json({ message: 'Order cancelled successfully', order: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error cancelling shipment' });
  }
};

// Request Return Flow
const requestReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = getTableData('orders.xlsx');
    const order = orders.find(o => String(o.id) === String(orderId));

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'Delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be returned' });
    }

    const updated = updateRow('orders.xlsx', order.id, {
      orderStatus: 'Return Requested'
    });

    // Send email alert
    try {
      const { sendOrderStatusEmail } = require('./orderController');
      await sendOrderStatusEmail(updated, 'Return Requested');
    } catch (emailErr) {
      console.error('Nodemailer return requested email failed:', emailErr.message);
    }

    return res.json({ message: 'Return request submitted successfully', order: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error requesting return' });
  }
};

module.exports = {
  createShipment,
  trackShipment,
  cancelShipment,
  createShipmentInternal,
  requestReturn
};

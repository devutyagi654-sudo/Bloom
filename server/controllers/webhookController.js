const Order = require('../models/Order');
const { sendOrderStatusEmail } = require('./orderController');

// Shiprocket Webhook Receiver
const handleShiprocketWebhook = async (req, res) => {
  try {
    const payload = req.body;
    console.log('Received Shiprocket Webhook Payload:', JSON.stringify(payload));

    const awb = payload.awb || (payload.awb_info && payload.awb_info.awb_code);
    const shipStatus = String(payload.current_status || '').toLowerCase().trim();

    if (!awb) {
      return res.status(400).json({ message: 'AWB code is missing in webhook payload' });
    }

    const order = await Order.findOne({ awbCode: String(awb) });

    if (!order) {
      console.log(`Webhook ignored: No order matched AWB ${awb}`);
      return res.json({ message: 'AWB not matched locally, webhook recorded' });
    }

    let nextStatus = order.orderStatus;
    let paymentStatus = order.paymentStatus;

    if (shipStatus.includes('delivered')) {
      nextStatus = 'Delivered';
      paymentStatus = 'Paid';
    } else if (shipStatus.includes('out for delivery') || shipStatus.includes('out_for_delivery')) {
      nextStatus = 'Out for Delivery';
    } else if (shipStatus.includes('transit') || shipStatus.includes('in_transit')) {
      nextStatus = 'In Transit';
    } else if (shipStatus.includes('shipped')) {
      nextStatus = 'Shipped';
    } else if (shipStatus.includes('packed') || shipStatus.includes('ready to ship')) {
      nextStatus = 'Ready to Ship';
    }

    if (nextStatus !== order.orderStatus || paymentStatus !== order.paymentStatus) {
      order.orderStatus = nextStatus;
      order.paymentStatus = paymentStatus;
      await order.save();

      console.log(`Order #${order._id} automatically updated via Shiprocket Webhook to: ${nextStatus}`);

      try {
        await sendOrderStatusEmail(order, nextStatus);
      } catch (err) {
        console.error('Webhook mail notification error:', err);
      }
    }

    return res.json({ success: true, message: `Status updated to ${nextStatus}` });
  } catch (error) {
    console.error('Shiprocket webhook error:', error);
    return res.status(500).json({ message: 'Webhook processing error' });
  }
};

module.exports = {
  handleShiprocketWebhook
};

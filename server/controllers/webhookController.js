const { getTableData, updateRow } = require('../config/db');
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

    const orders = getTableData('orders.xlsx');
    const order = orders.find(o => String(o.awbCode) === String(awb));

    if (!order) {
      console.log(`Webhook ignored: No order matched AWB ${awb}`);
      return res.json({ message: 'AWB not matched locally, webhook recorded' });
    }

    let nextStatus = order.orderStatus;
    let paymentStatus = order.paymentStatus;

    if (shipStatus.includes('delivered')) {
      nextStatus = 'Delivered';
      paymentStatus = 'Paid'; // If COD, mark as paid upon delivery
    } else if (shipStatus.includes('out for delivery') || shipStatus.includes('out_for_delivery')) {
      nextStatus = 'Out For Delivery';
    } else if (shipStatus.includes('transit') || shipStatus.includes('in_transit')) {
      nextStatus = 'In Transit';
    } else if (shipStatus.includes('shipped')) {
      nextStatus = 'Shipped';
    } else if (shipStatus.includes('packed') || shipStatus.includes('ready to ship')) {
      nextStatus = 'Packed';
    }

    // Only update and send mail if status changed
    if (nextStatus !== order.orderStatus || paymentStatus !== order.paymentStatus) {
      const updated = updateRow('orders.xlsx', order.id, {
        orderStatus: nextStatus,
        paymentStatus
      });

      console.log(`Order #${order.id} automatically updated via Shiprocket Webhook to: ${nextStatus}`);

      // Dispatch Nodemailer Status Alert
      try {
        await sendOrderStatusEmail(updated, nextStatus);
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

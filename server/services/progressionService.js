const Order = require('../models/Order');
const OrderStatusHistory = require('../models/OrderStatusHistory');
const Setting = require('../models/Setting');
const { transitionOrderStatus } = require('../controllers/orderController');

const STATUS_SEQUENCE = [
  'Pending',
  'Order Confirmed',
  'Processing',
  'Ready to Ship',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

let intervalId = null;

const checkAndProgressOrders = async () => {
  try {
    const settings = await Setting.findOne();
    if (settings && settings.autoStatusProgression === false) return;

    const delayMs = Number((settings && settings.progressionDelaySeconds) || 30) * 1000;

    const orders = await Order.find({
      orderStatus: { $nin: ['Cancelled', 'Return Requested', 'Returned', 'Refunded', 'Failed', 'Delivered'] }
    });

    const now = new Date();

    for (const order of orders) {
      const currentStatus = order.orderStatus || 'Pending';
      const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
      if (currentIndex === -1 || currentStatus === 'Delivered') continue;

      // Rule: Razorpay orders cannot leave "Pending" unless they are Paid
      if (currentStatus === 'Pending' && order.paymentMethod === 'Razorpay' && order.paymentStatus !== 'Paid') {
        continue;
      }

      const orderLogs = await OrderStatusHistory.find({ orderId: String(order._id) }).sort({ timestamp: -1 }).limit(1);
      let lastUpdateTime = new Date(order.createdAt || now);
      
      if (orderLogs.length > 0) {
        lastUpdateTime = new Date(orderLogs[0].timestamp || orderLogs[0].createdAt);
      }

      const elapsedMs = now - lastUpdateTime;
      if (elapsedMs >= delayMs) {
        const nextStatus = STATUS_SEQUENCE[currentIndex + 1];
        console.log(`[AUTO-PROGRESSION] Moving Order #${order._id} from "${currentStatus}" to "${nextStatus}"`);
        await transitionOrderStatus(order._id, nextStatus, 'System', 'Automatic status progression');
      }
    }
  } catch (error) {
    console.error('Error running automatic order status progression:', error);
  }
};

const startProgressionService = () => {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(checkAndProgressOrders, 10000);
  console.log('Order Status Auto-Progression Background Service initialized.');
};

const stopProgressionService = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = {
  startProgressionService,
  stopProgressionService
};

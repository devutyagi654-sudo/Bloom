const fs = require('fs');
const path = require('path');
const { getTableData } = require('../config/db');
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
    // 1. Read settings
    const settingsPath = path.join(__dirname, '../database/settings.json');
    if (!fs.existsSync(settingsPath)) return;
    
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (!settings.autoStatusProgression) return;

    const delayMs = Number(settings.progressionDelaySeconds || 30) * 1000;

    // 2. Fetch orders and logs
    const orders = getTableData('orders.xlsx');
    const history = getTableData('order_status_history.xlsx');

    const now = new Date();

    for (const order of orders) {
      const currentStatus = order.orderStatus || 'Pending';
      
      // Stop immediately if special terminal statuses
      const terminalStatuses = ['Cancelled', 'Return Requested', 'Returned', 'Refunded', 'Failed'];
      if (terminalStatuses.includes(currentStatus)) continue;

      const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
      if (currentIndex === -1 || currentStatus === 'Delivered') continue;

      // Rule: Razorpay orders cannot leave "Pending" unless they are Paid
      if (currentStatus === 'Pending' && order.paymentMethod === 'Razorpay' && order.paymentStatus !== 'Paid') {
        continue;
      }

      // Check last transition timestamp from logs
      const orderLogs = history.filter(h => String(h.orderId) === String(order.id));
      let lastUpdateTime = new Date(order.createdAt || now);
      
      if (orderLogs.length > 0) {
        // Find latest log timestamp
        const sorted = orderLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        lastUpdateTime = new Date(sorted[0].timestamp);
      }

      const elapsedMs = now - lastUpdateTime;
      if (elapsedMs >= delayMs) {
        const nextStatus = STATUS_SEQUENCE[currentIndex + 1];
        console.log(`[AUTO-PROGRESSION] Moving Order #${order.id} from "${currentStatus}" to "${nextStatus}"`);
        await transitionOrderStatus(order.id, nextStatus, 'System', 'Automatic status progression');
      }
    }
  } catch (error) {
    console.error('Error running automatic order status progression:', error);
  }
};

const startProgressionService = () => {
  if (intervalId) clearInterval(intervalId);
  // Scan every 10 seconds
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

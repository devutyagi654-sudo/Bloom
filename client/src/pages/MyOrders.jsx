import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_URL from '../apiConfig';
import { ShoppingBag, CreditCard, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDirectPrice } from '../utils/currency';

const MyOrders = () => {
  const token = useSelector((state) => state.auth.token);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${API_URL}/orders/myorders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && token) {
      fetchOrders();
    }
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <ShoppingBag className="w-12 h-12 text-neutral-400 mb-4 animate-bounce" />
        <h2 className="font-playfair text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-neutral-500 text-sm max-w-sm mb-6">Please log in to view your orders history.</p>
        <Link to="/login" className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest py-3.5 px-8 rounded">
          Log In
        </Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Shipped':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Processing':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Cancelled':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors duration-300 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="font-playfair text-3xl font-bold tracking-wide mb-8 text-neutral-900 dark:text-white">
          Order Ledger
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-900">
            <ShoppingBag className="w-12 h-12 text-neutral-300 dark:text-neutral-800 mx-auto mb-4" />
            <h3 className="font-playfair text-xl font-bold mb-2">No Orders Placed Yet</h3>
            <p className="text-neutral-400 text-sm max-w-sm mx-auto mb-6">
              You haven't ordered any luxury statement jewelry or timepieces yet.
            </p>
            <Link to="/shop" className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest py-3.5 px-8 rounded hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-neutral-50 dark:bg-neutral-950 p-6 rounded-xl border border-neutral-100 dark:border-neutral-900 shadow-sm space-y-4"
              >
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200/60 dark:border-neutral-900 pb-4 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Reference</span>
                    <span className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200">#BLC-2026-{order.id}</span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center text-xs text-neutral-500">
                      <Calendar className="w-4 h-4 mr-1 text-neutral-400" />
                      <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border rounded-full ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Items layout */}
                <div className="space-y-3">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        {item.image && (
                          <img
                            src={item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`}
                            alt={item.name}
                            className="w-10 h-12 object-cover rounded bg-neutral-200"
                          />
                        )}
                        <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                          {item.name} <span className="font-bold text-[10px] text-neutral-400">x{item.quantity}</span>
                        </span>
                      </div>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatDirectPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom billing info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-neutral-200/60 dark:border-neutral-900 pt-4 gap-2 text-xs">
                  <div className="flex items-center space-x-6 text-neutral-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-neutral-400" />
                      <span>Method: {order.paymentMethod}</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-1 text-neutral-400" />
                      <span>Status: {order.paymentStatus}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-neutral-400 mr-1">Delivery:</span>
                      <span className={order.shippingCharges === 0 ? "text-green-500 font-semibold" : "text-neutral-700 dark:text-neutral-300 font-semibold"}>
                        {order.shippingCharges === 0 ? 'FREE' : formatDirectPrice(order.shippingCharges)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Total Debited:</span>
                    <span className="text-luxury-gold-600 dark:text-luxury-gold-400 font-bold text-sm">
                      {formatDirectPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Operations Action Buttons Deck */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-neutral-200/40 dark:border-neutral-900/60">
                  {order.paymentMethod === 'Razorpay' && (order.paymentStatus === 'Failed' || order.orderStatus === 'Pending') && (
                    <button
                      type="button"
                      onClick={() => handleRetryPayment(order)}
                      className="bg-luxury-gold-600 hover:bg-luxury-gold-700 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded transition-colors"
                    >
                      Pay Again
                    </button>
                  )}
                  <Link
                    to={`/orders/track/${order.id}`}
                    className="bg-black dark:bg-white text-white dark:text-black font-semibold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                  >
                    Track Order
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice(order.id)}
                    className="border border-neutral-300 dark:border-neutral-800 font-semibold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded hover:border-neutral-400 transition-colors text-neutral-700 dark:text-neutral-300"
                  >
                    Download Invoice
                  </button>
                  {['Pending', 'Confirmed', 'Packed'].includes(order.orderStatus) && (
                    <button
                      type="button"
                      onClick={() => handleCancelOrder(order.id)}
                      className="border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 font-semibold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}
                  {order.orderStatus === 'Delivered' && (
                    <button
                      type="button"
                      onClick={() => handleRequestReturn(order.id)}
                      className="border border-amber-500/20 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 font-semibold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded transition-colors"
                    >
                      Request Return
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

// Handlers for Order Operations
const handleDownloadInvoice = async (orderId) => {
  const token = localStorage.getItem('token') || '';
  try {
    const res = await axios.get(`${API_URL}/orders/${orderId}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_BLC_${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Invoice download error:', err);
    alert('Failed to download invoice PDF.');
  }
};

const handleCancelOrder = async (orderId) => {
  const token = localStorage.getItem('token') || '';
  const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
  if (!confirmCancel) return;
  try {
    await axios.post(`${API_URL}/shipping/cancel/${orderId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert("Order cancelled successfully");
    window.location.reload();
  } catch (err) {
    console.error('Cancel order error:', err);
    alert(err.response?.data?.message || 'Failed to cancel order.');
  }
};

const handleRequestReturn = async (orderId) => {
  const token = localStorage.getItem('token') || '';
  const confirmReturn = window.confirm("Are you sure you want to request a return for this order?");
  if (!confirmReturn) return;
  try {
    await axios.post(`${API_URL}/shipping/return/${orderId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert("Return request submitted successfully");
    window.location.reload();
  } catch (err) {
    console.error('Request return error:', err);
    alert(err.response?.data?.message || 'Failed to request return.');
  }
};

const handleRetryPayment = async (order) => {
  const token = localStorage.getItem('token') || '';
  try {
    const rzRes = await axios.post(
      `${API_URL}/payment/retry-order`,
      { orderId: order.id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const rzOrder = rzRes.data;

    if (rzOrder.mockMode) {
      const confirmPayment = window.confirm("BLC Sandbox Gateway: Press OK to simulate a successful Razorpay transaction retry.");
      if (confirmPayment) {
        await axios.post(
          `${API_URL}/payment/verify`,
          {
            razorpayOrderId: rzOrder.orderId,
            razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
            razorpaySignature: 'mock_signature',
            orderData: {
              fullName: order.fullName,
              email: order.email,
              mobile: order.mobile,
              address: order.address,
              city: order.city,
              state: order.state,
              zip: order.zip
            }
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Retry payment completed successfully!");
        window.location.reload();
      }
    } else {
      // Live Razorpay Widget
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'your_razorpay_key_id',
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        name: "BLC Atelier",
        description: "Retry Order Payment",
        order_id: rzOrder.orderId,
        prefill: {
          name: order.fullName,
          email: order.email,
          contact: order.mobile
        },
        theme: {
          color: "#b47248"
        },
        handler: async function (response) {
          try {
            await axios.post(
              `${API_URL}/payment/verify`,
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderData: {
                  fullName: order.fullName,
                  email: order.email,
                  mobile: order.mobile,
                  address: order.address,
                  city: order.city,
                  state: order.state,
                  zip: order.zip
                }
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Payment successful!");
            window.location.reload();
          } catch (err) {
            alert(err.response?.data?.message || 'Payment verification failed');
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to initiate retry payment order');
  }
};

export default MyOrders;

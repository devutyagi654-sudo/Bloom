import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_URL from '../../apiConfig';
import AdminLayout from '../../components/Admin/AdminLayout';
import { Eye, Edit, Check, CheckCircle, Clock } from 'lucide-react';
import { formatDirectPrice } from '../../utils/currency';

const ManageOrders = () => {
  const token = useSelector((state) => state.auth.token);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected order details modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Status editing states
  const [tempStatus, setTempStatus] = useState('');
  const [tempPayStatus, setTempPayStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Auto Status Progression Settings
  const [settings, setSettings] = useState({ autoStatusProgression: false, progressionDelaySeconds: 30 });
  const [historyTimeline, setHistoryTimeline] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      setError('Failed to fetch orders log');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchSettings();
    }
  }, [token]);

  const handleToggleAutoStatus = async () => {
    try {
      const nextVal = !settings.autoStatusProgression;
      const res = await axios.post(
        `${API_URL}/admin/settings`,
        { autoStatusProgression: nextVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(res.data);
      alert(`Auto status progression is now ${nextVal ? 'ENABLED' : 'DISABLED'}`);
    } catch (err) {
      alert('Failed to update progression settings');
    }
  };

  const openDetailsModal = async (ord) => {
    setSelectedOrder(ord);
    setTempStatus(ord.orderStatus);
    setTempPayStatus(ord.paymentStatus);
    setNotes('');
    setIsModalOpen(true);
    setHistoryTimeline([]);
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_URL}/shipping/track/${ord.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryTimeline(res.data.milestones || []);
    } catch (err) {
      console.error('Failed to load tracking log history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const res = await axios.put(
        `${API_URL}/admin/orders/${selectedOrder.id}/status`,
        { orderStatus: tempStatus, paymentStatus: tempPayStatus, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update details
      setSelectedOrder(res.data);
      setNotes('');
      
      // Update list
      setOrders(orders.map(o => String(o.id) === String(res.data.id) ? res.data : o));
      
      // Refresh history timeline
      const trackRes = await axios.get(`${API_URL}/shipping/track/${selectedOrder.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryTimeline(trackRes.data.milestones || []);
      
      alert('Order status updated successfully');
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
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

  const handleRefund = async () => {
    if (!selectedOrder) return;
    const confirmRefund = window.confirm("Are you sure you want to refund this transaction via Razorpay?");
    if (!confirmRefund) return;
    setUpdating(true);
    try {
      const res = await axios.post(
        `${API_URL}/payment/refund/${selectedOrder.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update details
      setSelectedOrder(res.data.order);
      
      // Update list
      setOrders(orders.map(o => String(o.id) === String(selectedOrder.id) ? res.data.order : o));
      
      alert('Refund processed successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'text-green-500 border-green-500/20 bg-green-500/5';
      case 'Cancelled':
      case 'Failed':
        return 'text-red-500 border-red-500/20 bg-red-500/5';
      case 'Returned':
      case 'Refunded':
        return 'text-purple-500 border-purple-500/20 bg-purple-500/5';
      case 'Return Requested':
        return 'text-pink-500 border-pink-500/20 bg-pink-500/5';
      default:
        return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header Section with Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 dark:border-neutral-900 pb-5 gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold tracking-wide text-neutral-900 dark:text-white">
              Order Logs
            </h1>
            <p className="text-neutral-400 text-xs mt-1 uppercase tracking-widest font-semibold">Track customer transactions and manage fulfillment</p>
          </div>
          <div className="flex items-center space-x-3 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 rounded-xl border border-neutral-100 dark:border-neutral-900">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-300">Auto Status Progression</span>
            <button
              onClick={handleToggleAutoStatus}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                settings.autoStatusProgression ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  settings.autoStatusProgression ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-lg text-xs text-red-500 font-semibold">
            {error}
          </div>
        )}

        {/* Orders List Table */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-900 rounded-xl shadow-sm">
            <p className="text-neutral-400 text-sm">No orders recorded yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-900 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-900 text-neutral-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Order Reference</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Total Price</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">Order Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-medium">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                      <td className="py-3.5 px-4 font-mono font-bold">#BLC-2026-{ord.id}</td>
                      <td className="py-3.5 px-4">{ord.fullName}</td>
                      <td className="py-3.5 px-4">{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : ''}</td>
                      <td className="py-3.5 px-4 font-bold text-luxury-gold-600 dark:text-luxury-gold-400">{formatDirectPrice(ord.totalAmount)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          ord.paymentStatus === 'Paid' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 border rounded-full ${getStatusBadgeClass(ord.orderStatus)}`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openDetailsModal(ord)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 rounded hover:border-luxury-gold-500 hover:text-luxury-gold-500 transition-colors font-semibold text-[10px] uppercase ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Fulfill</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Details & Status Modifying Modal */}
        {isModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-900 rounded-2xl p-6 sm:p-8 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl relative">
              
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-650 transition-colors"
              >
                ✕
              </button>

              <h3 className="font-playfair text-xl font-bold tracking-wide text-neutral-850 dark:text-white mb-6">
                Fulfill Order Ledger #BLC-{selectedOrder.id}
              </h3>

              <div className="space-y-6">
                
                {/* Status Dropdowns */}
                <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-900/60 p-4 rounded-xl border border-neutral-100 dark:border-neutral-900">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Order Fulfillment</label>
                    <select
                      value={tempStatus}
                      onChange={(e) => setTempStatus(e.target.value)}
                      className="w-full text-xs py-2 px-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-850 rounded focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Order Confirmed">Order Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Ready to Ship">Ready to Ship</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Return Requested">Return Requested</option>
                      <option value="Returned">Returned</option>
                      <option value="Refunded">Refunded</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Payment Status</label>
                    <select
                      value={tempPayStatus}
                      onChange={(e) => setTempPayStatus(e.target.value)}
                      className="w-full text-xs py-2 px-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-850 rounded focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>

                  <div className="col-span-full">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Status Update Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter details (e.g. Courier bluedart awb generated, client cancellation request...)"
                      rows={2}
                      className="w-full text-xs py-2 px-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-850 rounded focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="col-span-full mt-2 py-2 bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest rounded hover:opacity-85 disabled:opacity-50 transition-all animate-none"
                  >
                    {updating ? 'Updating Log...' : 'Confirm Status Update'}
                  </button>

                  {selectedOrder.paymentMethod === 'Razorpay' && selectedOrder.paymentStatus === 'Paid' && ['Cancelled', 'Returned', 'Refunded'].includes(tempStatus) && (
                    <button
                      type="button"
                      onClick={handleRefund}
                      disabled={updating}
                      className="col-span-full mt-1 py-2 bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded hover:bg-red-700 disabled:opacity-50 transition-all"
                    >
                      {updating ? 'Processing Refund...' : 'Refund Payment via Razorpay'}
                    </button>
                  )}
                </div>

                {/* Shipping & Billing details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-t border-neutral-100 dark:border-neutral-900 pt-5">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] block mb-1">Shipping Coordinates</span>
                    <p className="font-semibold">{selectedOrder.fullName}</p>
                    <p className="text-neutral-500">{selectedOrder.address}</p>
                    <p className="text-neutral-500">{selectedOrder.city}, {selectedOrder.state} {selectedOrder.zip}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] block mb-1">Billing Details</span>
                    <p className="text-neutral-500">Email: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{selectedOrder.email}</span></p>
                    <p className="text-neutral-500">Phone: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{selectedOrder.mobile}</span></p>
                    <p className="text-neutral-500">Payment: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{selectedOrder.paymentMethod}</span></p>
                  </div>
                </div>

                {/* Admin Shipment Panel */}
                {(selectedOrder.awbCode || selectedOrder.shipmentId) && (
                  <div className="border-t border-neutral-100 dark:border-neutral-900 pt-5 space-y-3">
                    <span className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] block">Admin Logistics Panel</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-neutral-50 dark:bg-neutral-900/40 p-3 rounded-lg">
                      <div>
                        <span className="text-[9px] text-neutral-450 block font-bold uppercase">Courier</span>
                        <span className="font-semibold">{selectedOrder.courierName || 'BlueDart'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-450 block font-bold uppercase">AWB Code</span>
                        <span className="font-mono font-semibold">{selectedOrder.awbCode || 'AWB123456789'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-450 block font-bold uppercase">Shipment ID</span>
                        <span className="font-mono font-semibold">{selectedOrder.shipmentId || 'SHIP9988221'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-450 block font-bold uppercase">Pickup Status</span>
                        <span className="font-semibold text-green-500">Ready for Pickup</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] font-bold uppercase tracking-wider">
                      <a
                        href={selectedOrder.shippingLabelUrl || "https://track.shiprocket.co/"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center p-2 border border-neutral-200 dark:border-neutral-800 rounded hover:text-luxury-gold-500 hover:border-luxury-gold-500 text-center"
                      >
                        Label
                      </a>
                      <a
                        href={selectedOrder.manifestUrl || "https://track.shiprocket.co/"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center p-2 border border-neutral-200 dark:border-neutral-800 rounded hover:text-luxury-gold-500 hover:border-luxury-gold-500 text-center"
                      >
                        Manifest
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(selectedOrder.id)}
                        className="flex items-center justify-center p-2 border border-neutral-200 dark:border-neutral-800 rounded hover:text-luxury-gold-500 hover:border-luxury-gold-500 text-center"
                      >
                        Invoice
                      </button>
                      <a
                        href={selectedOrder.trackingUrl || `https://shiprocket.co/tracking/${selectedOrder.awbCode || 'AWB123456789'}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center p-2 bg-black dark:bg-white text-white dark:text-black rounded hover:opacity-80 text-center"
                      >
                        Track
                      </a>
                    </div>
                  </div>
                )}
                {/* Order History Log Audit Trail */}
                <div className="border-t border-neutral-100 dark:border-neutral-900 pt-5 space-y-3">
                  <span className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] block">Audit Trail / History Logs</span>
                  {loadingHistory ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : historyTimeline.length === 0 ? (
                    <p className="text-[10px] text-neutral-400 italic">No history logs recorded.</p>
                  ) : (
                    <div className="space-y-3 font-sans max-h-48 overflow-y-auto pr-1">
                      {historyTimeline.map((log, i) => (
                        <div key={i} className="flex items-start justify-between text-[11px] border-b border-neutral-50 dark:border-neutral-900/40 pb-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">{log.status}</span>
                              <span className="text-[8px] bg-neutral-150 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{log.updatedBy || 'System'}</span>
                            </div>
                            <p className="text-neutral-400 font-light">{log.description}</p>
                          </div>
                          <span className="text-[9px] text-neutral-400 font-mono">
                            {new Date(log.date).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Items grid list */}
                <div className="border-t border-neutral-100 dark:border-neutral-900 pt-5 space-y-3">
                  <span className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] block mb-2">Itemizations</span>
                  {selectedOrder.items && selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 font-medium">{item.name} (x{item.quantity})</span>
                      <span className="font-semibold">{formatDirectPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  
                  <div className="flex justify-between border-t border-neutral-100 dark:border-neutral-900 pt-3 text-xs">
                    <span className="text-neutral-500">Delivery Charge</span>
                    <span className={selectedOrder.shippingCharges === 0 ? "text-green-500 font-semibold" : "font-semibold"}>
                      {selectedOrder.shippingCharges === 0 ? 'FREE' : formatDirectPrice(selectedOrder.shippingCharges)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-100 dark:border-neutral-900 pt-3 text-sm font-bold text-neutral-800 dark:text-white">
                    <span>Grand Total</span>
                    <span className="text-luxury-gold-600">{formatDirectPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default ManageOrders;

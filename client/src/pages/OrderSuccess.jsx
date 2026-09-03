import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { formatDirectPrice } from '../utils/currency';
import API_URL from '../apiConfig';
import { Check, ShieldCheck, Mail, ArrowRight, ShoppingBag } from 'lucide-react';

const OrderSuccess = () => {
  const { id } = useParams();
  const location = useLocation();
  const stateOrder = location.state?.order;
  const token = useSelector((state) => state.auth.token);
  const [order, setOrder] = useState(stateOrder || null);
  const [loading, setLoading] = useState(!stateOrder);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const targetId = id || stateOrder?._id || stateOrder?.id;
        if (!targetId) {
          setLoading(false);
          return;
        }
        const res = await axios.get(`${API_URL}/orders/${targetId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to load order details', err);
      } finally {
        setLoading(false);
      }
    };

    if (token && (!order || id)) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [id, token]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors duration-300 py-16 px-4">
      <div className="max-w-3xl mx-auto text-center space-y-8 bg-neutral-50 dark:bg-neutral-950 p-8 sm:p-12 border border-neutral-100 dark:border-neutral-900 rounded-2xl shadow-xl relative overflow-hidden">
        
        {/* Decorative highlight */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Success checkmark */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 rounded-full flex items-center justify-center text-black shadow-lg animate-bounce">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>

        <div className="space-y-3">
          <span className="text-luxury-gold-600 dark:text-luxury-gold-400 font-bold uppercase tracking-widest text-xs">
            Transaction Successful
          </span>
          <h1 className="font-playfair text-3xl sm:text-4xl text-neutral-900 dark:text-white font-bold tracking-wide">
            Thank You for Your Order
          </h1>
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
            Order Reference: <span className="font-mono text-neutral-700 dark:text-neutral-300">#BLC-2026-{id || order?._id || order?.id || 'SUCCESS'}</span>
          </p>
        </div>

        <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
          Your Cash on Delivery order has been confirmed successfully. An automated digital invoice receipt and shipping details have been sent to your email.
        </p>

        {loading ? (
          <div className="w-8 h-8 border-2 border-luxury-gold-500 border-t-transparent rounded-full animate-spin mx-auto py-8"></div>
        ) : order ? (
          <div className="border-t border-b border-neutral-200 dark:border-neutral-900 py-6 text-left space-y-4 max-w-xl mx-auto">
            <h4 className="font-playfair font-bold text-neutral-800 dark:text-white text-sm uppercase tracking-widest">
              Atelier Order Summary
            </h4>
            
            {/* Order Items */}
            <div className="space-y-2 text-xs">
              {order.items && order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between font-medium">
                  <span className="text-neutral-500">{item.name} (x{item.quantity})</span>
                  <span className="text-neutral-800 dark:text-neutral-200">{formatDirectPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Detailed Totals Breakdown */}
            {(() => {
              const subtotal = order.items
                ? order.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
                : 0;
              const discount = Math.max(0, subtotal + Number(order.shippingCharges || 0) - Number(order.totalAmount));
              return (
                <div className="border-t border-neutral-100 dark:border-neutral-900/60 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-505">Subtotal</span>
                    <span className="text-neutral-800 dark:text-neutral-200">{formatDirectPrice(subtotal)}</span>
                  </div>
                  {discount > 0.05 && (
                    <div className="flex justify-between font-medium text-green-550">
                      <span>Discount</span>
                      <span>-{formatDirectPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-505">Delivery Charges</span>
                    <span className={order.shippingCharges === 0 ? "text-green-550 font-semibold" : "text-neutral-800 dark:text-neutral-200"}>
                      {order.shippingCharges === 0 ? 'FREE' : formatDirectPrice(order.shippingCharges)}
                    </span>
                  </div>
                  <div className="border-t border-neutral-200/60 dark:border-neutral-900 pt-3 flex justify-between font-bold text-sm text-neutral-800 dark:text-white">
                    <span>Grand Total</span>
                    <span className="text-luxury-gold-600 dark:text-luxury-gold-400">{formatDirectPrice(order.totalAmount)}</span>
                  </div>

                  {/* Payment & COD Breakdown Card */}
                  {(order.paymentMethod === 'COD + Razorpay Prepaid' || (order.codAmount > 0) || (order.prepaidAmount > 0)) && (
                    <div className="bg-amber-500/10 dark:bg-amber-500/15 p-3.5 rounded-xl border border-amber-500/20 space-y-2 mt-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">Payment Summary:</span>
                        <span className="bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-[10px] uppercase px-2 py-0.5 rounded border border-green-500/20">
                          {order.paymentStatus || '₹100 Paid'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        <span>Paid via Razorpay Online:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{formatDirectPrice(order.prepaidAmount || 100)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        <span>Remaining Balance (COD):</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{formatDirectPrice(order.codAmount || (order.totalAmount - (order.prepaidAmount || 100)))}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Shipping Detail */}
            <div className="border-t border-neutral-100 dark:border-neutral-900/60 pt-3 text-xs space-y-1 text-neutral-500">
              <span className="font-bold text-neutral-600 dark:text-neutral-400 block uppercase tracking-wide text-[9px] mb-1">Insured Shipping Address</span>
              <p>{order.fullName}</p>
              <p>{order.address}, {order.city}, {order.state} {order.zip}</p>
              <p>Payment Mode: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{order.paymentMethod}</span></p>
              <p>Payment Status: <span className="font-semibold text-green-600 dark:text-green-400">{order.paymentStatus}</span></p>
            </div>
          </div>
        ) : null}

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/orders"
            className="flex items-center space-x-2 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-black py-3 px-6 rounded font-semibold text-xs tracking-widest uppercase transition-colors shadow"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Track Orders</span>
          </Link>
          <Link
            to="/shop"
            className="flex items-center space-x-2 text-luxury-gold-600 dark:text-luxury-gold-400 hover:text-black dark:hover:text-white font-semibold text-xs tracking-widest uppercase transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default OrderSuccess;

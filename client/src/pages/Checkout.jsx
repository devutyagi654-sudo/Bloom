import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, selectCartTotal, clearCart } from '../redux/cartSlice';
import axios from 'axios';
import { formatDirectPrice } from '../utils/currency';
import API_URL from '../apiConfig';
import { CreditCard, Truck, CheckCircle, ArrowLeft } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  
  const { items, loading } = useSelector((state) => state.cart);
  const subtotal = useSelector(selectCartTotal);

  // Form inputs
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const deliveryCharge = 0;
  const finalTotal = subtotal + deliveryCharge;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(fetchCart());
  }, [isAuthenticated, dispatch, navigate]);

  // Load Razorpay SDK Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setMobile(user.mobile || '');
    }
  }, [user]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    setError('');

    // Validate shipping fields
    if (!fullName || !email || !mobile || !address || !city || !state || !zip) {
      setError('Please fill in all shipping details');
      setSubmitting(false);
      return;
    }

    try {
      const orderPayload = {
        fullName,
        email,
        mobile,
        address,
        city,
        state,
        zip,
        paymentMethod: paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay',
        shippingCharges: 0,
        deliveryCharge: 0
      };

      const orderRes = await axios.post(
        `${API_URL}/orders`,
        orderPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderData = orderRes.data;

      // 1. Direct Cash on Delivery (COD) Placement
      if (paymentMethod === 'COD' || orderData.isCOD) {
        const createdOrder = orderData.order || orderData;
        const targetId = createdOrder._id || createdOrder.id;

        dispatch(clearCart());
        navigate(`/order-success/${targetId}`, { state: { order: createdOrder } });
        return;
      }

      // 2. Prepaid Online Payment (Razorpay) Flow
      const rzOrderId = orderData.razorpayOrderId || orderData.id || orderData._id;

      if (orderData.mockMode) {
        const confirmPayment = window.confirm(
          `BLC Sandbox Gateway: Press OK to simulate a successful Razorpay online transaction.`
        );
        if (confirmPayment) {
          const verifyRes = await axios.post(
            `${API_URL}/payment/verify`,
            {
              razorpayOrderId: rzOrderId,
              razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
              razorpaySignature: 'mock_signature',
              razorpay_order_id: rzOrderId,
              razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
              razorpay_signature: 'mock_signature',
              orderData: orderPayload
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (verifyRes.data.success) {
            const createdOrder = verifyRes.data.order || verifyRes.data;
            const targetId = createdOrder._id || createdOrder.id;

            dispatch(clearCart());
            navigate(`/order-success/${targetId}`, { state: { order: createdOrder } });
          } else {
            setError(verifyRes.data.message || 'Payment verification failed');
          }
        } else {
          setError('Online payment cancelled by user.');
        }
        setSubmitting(false);
        return;
      }

      // Real Razorpay Checkout Modal
      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'bloomluxecollection',
        description: 'Luxury Jewelry & Timepieces Checkout',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=120&auto=format&fit=crop&q=80',
        order_id: rzOrderId,
        handler: async function (response) {
          try {
            const verifyPayload = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: orderPayload
            };

            const verifyRes = await axios.post(
              `${API_URL}/payment/verify`,
              verifyPayload,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success || verifyRes.status === 200 || verifyRes.status === 201) {
              const createdOrder = verifyRes.data.order || verifyRes.data;
              const targetId = createdOrder._id || createdOrder.id;

              dispatch(clearCart());
              navigate(`/order-success/${targetId}`, { state: { order: createdOrder } });
            } else {
              setError(verifyRes.data.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('[PAYMENT_VERIFICATION_ERROR]', err);
            setError(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: fullName,
          email: email,
          contact: mobile
        },
        theme: {
          color: '#C98A63'
        },
        modal: {
          ondismiss: function() {
            setError('Razorpay checkout cancelled by user.');
            setSubmitting(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response) {
        setError(response.error?.description || 'Payment Failed');
        setSubmitting(false);
      });
      razorpayInstance.open();

    } catch (err) {
      console.error('[CHECKOUT_ERROR]', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to place order';
      setError(errMsg);
      setSubmitting(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7E8DF]/40 dark:bg-[#1E130D]/40 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C98A63] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#F7E8DF]/40 dark:bg-[#1E130D]/40 text-[#4A3226] dark:text-[#F7E8DF] flex flex-col items-center justify-center text-center px-4">
        <Truck className="w-12 h-12 text-[#C98A63] mb-4 animate-bounce" />
        <h2 className="font-playfair text-2xl font-bold mb-2">No Items to Checkout</h2>
        <p className="text-[#4A3226]/75 dark:text-[#F7E8DF]/65 text-sm max-w-sm mb-6">Your shopping bag is currently empty. Please select luxury pieces before proceeding.</p>
        <Link to="/shop" className="btn-luxury py-3.5 px-8 font-semibold text-xs tracking-widest uppercase transition-all duration-300">
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7E8DF]/40 dark:bg-[#1E130D]/40 text-[#4A3226] dark:text-[#F7E8DF] transition-colors duration-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between border-b border-[#C98A63]/20 dark:border-[#C98A63]/15 pb-6 mb-8">
          <Link to="/cart" className="flex items-center text-xs font-semibold text-[#4A3226]/75 dark:text-[#F7E8DF]/65 hover:text-[#C98A63] transition-colors uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
          </Link>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold tracking-wide text-[#4A3226] dark:text-white">
            Secure Checkout
          </h1>
          <div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Form Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-luxury p-6 sm:p-8 space-y-6 shadow-sm">
              
              <div className="flex items-center space-x-3 pb-4 border-b border-[#C98A63]/20 dark:border-[#C98A63]/15">
                <Truck className="w-5 h-5 text-[#C98A63]" />
                <h3 className="font-playfair text-lg font-bold tracking-wide text-[#4A3226] dark:text-white">
                  1. Shipping & Contact Details
                </h3>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs py-3 px-3.5 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
                      Mobile Number (For Shipping Tracking) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full text-xs py-3 px-3.5 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
                    Email Address (For Digital Order Invoice) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs py-3 px-3.5 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
                    Street Address / Suite / Apartment *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House / Flat No., Road, Landmark"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs py-3 px-3.5 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs py-3 px-3.5 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full text-xs py-3 px-3.5 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
                      Postal Code / ZIP *
                    </label>
                    <input
                      type="text"
                      required
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full text-xs py-3 px-3.5 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                    />
                  </div>
                </div>

              </form>

            </div>

            {/* Payment Method Selector */}
            <div className="card-luxury p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center space-x-3 pb-4 border-b border-[#C98A63]/20 dark:border-[#C98A63]/15">
                <CreditCard className="w-5 h-5 text-[#C98A63]" />
                <h3 className="font-playfair text-lg font-bold tracking-wide text-[#4A3226] dark:text-white">
                  2. Select Payment Method
                </h3>
              </div>

              <div className="space-y-3">
                {/* Prepaid Razorpay Option */}
                <div 
                  onClick={() => setPaymentMethod('Razorpay')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'Razorpay' 
                      ? 'border-[#C98A63] bg-[#F4DDD2]/40 dark:bg-[#120a06]/40 shadow-sm' 
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-[#C98A63]/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-4 ${paymentMethod === 'Razorpay' ? 'border-[#C98A63] bg-white' : 'border-neutral-400'}`}></div>
                    <div>
                      <span className="font-bold text-xs text-[#4A3226] dark:text-white block">Prepaid Online Payment (Razorpay / UPI / Cards)</span>
                      <span className="text-[10px] text-[#4A3226]/60 dark:text-[#F7E8DF]/50">Credit/Debit Cards, UPI, GooglePay, Paytm, PhonePe, NetBanking</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 font-bold uppercase px-2.5 py-1 rounded-full border border-green-500/20">
                    FREE Delivery
                  </span>
                </div>

                {/* Cash on Delivery Option */}
                <div 
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'COD' 
                      ? 'border-[#C98A63] bg-[#F4DDD2]/40 dark:bg-[#120a06]/40 shadow-sm' 
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-[#C98A63]/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-4 ${paymentMethod === 'COD' ? 'border-[#C98A63] bg-white' : 'border-neutral-400'}`}></div>
                    <div>
                      <span className="font-bold text-xs text-[#4A3226] dark:text-white block">Cash on Delivery (COD)</span>
                      <span className="text-[10px] text-[#4A3226]/60 dark:text-[#F7E8DF]/50">Pay full amount in cash upon package delivery at your doorstep</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 font-bold uppercase px-2.5 py-1 rounded-full border border-green-500/20">
                    FREE Delivery
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Summary Column */}
          <div className="space-y-6">
            <div className="card-luxury p-6 sticky top-28 space-y-6 shadow-sm">
              
              <h3 className="font-playfair text-lg font-bold text-[#4A3226] dark:text-white pb-4 border-b border-[#C98A63]/20 dark:border-[#C98A63]/15 tracking-wide">
                Order Review ({items.length} {items.length === 1 ? 'item' : 'items'})
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar text-xs">
                {items.map((item) => {
                  const price = item.product.discountPrice || item.product.price;
                  return (
                    <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-[#C98A63]/10 dark:border-[#C98A63]/10">
                      <div>
                        <span className="text-[#4A3226]/80 dark:text-[#F7E8DF]/75 line-clamp-1 max-w-[160px]">
                          {item.product.name} <span className="font-bold text-[10px] text-[#4A3226]/50 dark:text-[#F7E8DF]/50">x{item.quantity}</span>
                        </span>
                        {item.selectedSize && (
                          <span className="text-[10px] font-bold text-[#C98A63] block">
                            Size: {item.selectedSize}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold">{formatDirectPrice(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Totals Summary */}
              <div className="pt-4 border-t border-[#C98A63]/20 dark:border-[#C98A63]/15 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4A3226]/75 dark:text-[#F7E8DF]/65">Subtotal</span>
                  <span className="font-semibold">{formatDirectPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A3226]/75 dark:text-[#F7E8DF]/65">Delivery Charges</span>
                  <span className="font-semibold text-green-500">FREE</span>
                </div>
                <div className="flex justify-between border-t border-[#C98A63]/20 dark:border-[#C98A63]/15 pt-3 font-bold text-base text-[#4A3226] dark:text-white">
                  <span>Grand Total</span>
                  <span className="text-[#C98A63]">{formatDirectPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                onClick={handlePlaceOrder}
                disabled={submitting || items.length === 0}
                className="w-full flex items-center justify-center space-x-2 btn-luxury py-4 font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-lg mt-4 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{submitting ? 'Processing Order...' : (paymentMethod === 'COD' ? 'Place Order (Cash on Delivery)' : 'Pay Online & Place Order')}</span>
              </button>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Checkout;

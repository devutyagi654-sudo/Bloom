import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, selectCartTotal, clearCart } from '../redux/cartSlice';
import axios from 'axios';
import { formatDirectPrice } from '../utils/currency';
import API_URL from '../apiConfig';
import { CreditCard, Truck, Send, CheckCircle, HelpCircle, ArrowLeft, Tag } from 'lucide-react';

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
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD or Razorpay
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(fetchCart());
  }, [isAuthenticated, dispatch, navigate]);

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setMobile(user.mobile || '');
    }
  }, [user]);

  // Apply Coupon
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.toUpperCase().trim();
    
    if (code === 'BLC10') {
      setDiscount(subtotal * 0.1);
      setAppliedCoupon(code);
      setCouponCode('');
    } else if (code === 'LUXURY20') {
      setDiscount(subtotal * 0.2);
      setAppliedCoupon(code);
      setCouponCode('');
    } else if (code === 'WELCOME500') {
      setDiscount(Math.min(500, subtotal));
      setAppliedCoupon(code);
      setCouponCode('');
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setAppliedCoupon('');
  };

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

    if (paymentMethod === 'COD') {
      // Direct Cash on Delivery placement
      try {
        const deliveryCharge = 50;
        const orderPayload = {
          fullName,
          email,
          mobile,
          address,
          city,
          state,
          zip,
          paymentMethod: 'COD',
          shippingCharges: deliveryCharge,
          deliveryCharge,
          couponCode: appliedCoupon
        };

        const res = await axios.post(
          `${API_URL}/orders`,
          orderPayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        dispatch(clearCart());
        navigate(`/order-success/${res.data.id}`);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to place COD order. Try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Online Payment (Razorpay Checkout)
      try {
        const orderPayload = {
          fullName,
          email,
          mobile,
          address,
          city,
          state,
          zip,
          paymentMethod: 'Razorpay',
          shippingCharges: 0,
          deliveryCharge: 0,
          couponCode: appliedCoupon
        };

        // 1. Create stashed Razorpay order draft on backend
        const orderRes = await axios.post(
          `${API_URL}/orders`,
          orderPayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const orderData = orderRes.data;

        if (orderData.mockMode) {
          // Simulated payment confirm
          const confirmPayment = window.confirm("BLC Sandbox Gateway: Press OK to simulate a successful Razorpay online transaction.");
          if (confirmPayment) {
            const verifyRes = await axios.post(
              `${API_URL}/payment/verify`,
              {
                razorpayOrderId: orderData.razorpayOrderId,
                razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
                razorpaySignature: 'mock_signature',
                orderData: orderPayload
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            dispatch(clearCart());
            navigate(`/order-success/${verifyRes.data.id}`);
          } else {
            alert('Payment cancelled/failed in simulated checkout. Your order is stashed. You can retry payment anytime in the My Orders section.');
            navigate('/orders');
          }
        } else {
          // Open Live Razorpay Modal
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'your_razorpay_key_id',
            amount: orderData.amount,
            currency: orderData.currency,
            name: "BLC Atelier",
            description: "Prepaid Order Checkout",
            order_id: orderData.razorpayOrderId,
            prefill: {
              name: fullName,
              email: email,
              contact: mobile
            },
            theme: {
              color: "#b47248" // luxury bronze theme accent
            },
            handler: async function (response) {
              try {
                setSubmitting(true);
                const verifyPayload = {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  orderData: orderPayload
                };

                const verifyRes = await axios.post(
                  `${API_URL}/payment/verify`,
                  verifyPayload,
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                dispatch(clearCart());
                navigate(`/order-success/${verifyRes.data.id}`);
              } catch (err) {
                setError(err.response?.data?.message || 'Prepaid payment verification failed');
              } finally {
                setSubmitting(false);
              }
            },
            modal: {
              ondismiss: function () {
                alert('Payment was dismissed. You can retry paying for this order in the My Orders section.');
                navigate('/orders');
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initiate online payment order');
        setSubmitting(false);
      }
    }
  };

  const shippingCharges = paymentMethod === 'COD' ? 50 : 0;
  const finalTotal = subtotal - discount + shippingCharges;

  return (
    <div className="min-h-screen bg-[#F7E8DF]/40 dark:bg-[#1E130D]/40 text-[#4A3226] dark:text-[#F7E8DF] transition-colors duration-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link to="/cart" className="text-xs uppercase tracking-widest font-bold flex items-center hover:text-[#C98A63] transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
          </Link>
        </div>

        <h1 className="font-playfair text-3xl font-bold tracking-wide mb-10 text-[#4A3226] dark:text-white">
          Secure Checkout
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-xs text-red-500 mb-8 max-w-4xl font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Form controls (Shipping + Payments) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. SHIPPING ADDRESS */}
            <div className="card-luxury p-6 space-y-4">
              <h3 className="font-playfair text-lg font-bold text-[#4A3226] dark:text-white pb-3 border-b border-[#C98A63]/20 dark:border-[#C98A63]/15 tracking-wide flex items-center">
                <Truck className="w-5 h-5 mr-2 text-[#C98A63]" /> Shipping Relations
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs py-3.5 px-3 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full text-xs py-3.5 px-3 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs py-3.5 px-3 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Apartment, suite, unit, street address"
                  className="w-full text-xs py-3.5 px-3 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs py-3.5 px-3 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">State / Region</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs py-3.5 px-3 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">ZIP / Postcode</label>
                  <input
                    type="text"
                    required
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full text-xs py-3.5 px-3 input-luxury rounded-xl focus:ring-[#C98A63] focus:border-[#C98A63]"
                  />
                </div>
              </div>

            </div>

            {/* 2. PAYMENT METHODS */}
            <div className="card-luxury p-6 space-y-6">
              <h3 className="font-playfair text-lg font-bold text-[#4A3226] dark:text-white pb-3 border-b border-[#C98A63]/20 dark:border-[#C98A63]/15 tracking-wide flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-[#C98A63]" /> Payment Atelier
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`py-4 rounded-xl text-center border font-bold text-xs uppercase tracking-widest transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-[#C98A63] bg-[#C98A63]/10 text-[#4A3226] dark:text-white font-black'
                      : 'border-[#C98A63]/30 dark:border-[#C98A63]/20 text-[#4A3226]/70 dark:text-[#F7E8DF]/60 hover:border-[#C98A63]'
                  }`}
                >
                  COD (₹50 Fee)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Razorpay')}
                  className={`py-4 rounded-xl text-center border font-bold text-xs uppercase tracking-widest transition-all ${
                    paymentMethod === 'Razorpay'
                      ? 'border-[#C98A63] bg-[#C98A63]/10 text-[#4A3226] dark:text-white font-black'
                      : 'border-[#C98A63]/30 dark:border-[#C98A63]/20 text-[#4A3226]/70 dark:text-[#F7E8DF]/60 hover:border-[#C98A63]'
                  }`}
                >
                  Online Payment (FREE)
                </button>
              </div>

              {paymentMethod === 'Razorpay' && (
                <div className="p-4 bg-[#F4DDD2]/30 dark:bg-[#120a06]/40 rounded-xl border border-[#C98A63]/25 dark:border-[#C98A63]/15 text-xs text-[#4A3226]/85 dark:text-[#F7E8DF]/75 leading-relaxed">
                  💳 Pay securely online using <strong className="text-[#C98A63]">Razorpay</strong>. 
                  All major credit/debit cards, Net Banking, and instant UPI transfers are supported.
                  <span className="block text-green-600 dark:text-green-500 font-bold mt-1">✓ Order qualifies for FREE Courier Shipping!</span>
                </div>
              )}

              {paymentMethod === 'COD' && (
                <div className="p-4 bg-[#F4DDD2]/30 dark:bg-[#120a06]/40 rounded-xl border border-[#C98A63]/25 dark:border-[#C98A63]/15 text-xs text-[#4A3226]/85 dark:text-[#F7E8DF]/75 leading-relaxed">
                  📦 Pay in cash upon delivery to your doorstep.
                  <span className="block text-amber-700 dark:text-amber-500 font-semibold mt-1">✓ A standard ₹50 cash collection fee will be added.</span>
                </div>
              )}

            </div>

          </div>

          {/* Right Summary sidebar */}
          <div className="space-y-6">
            <div className="card-luxury p-6 space-y-6">
              
              <h3 className="font-playfair text-lg font-bold text-[#4A3226] dark:text-white pb-3 border-b border-[#C98A63]/20 dark:border-[#C98A63]/15 tracking-wide">
                Items Order
              </h3>

              {/* Items Summary list */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => {
                  const price = item.product.discountPrice || item.product.price;
                  return (
                    <div key={item.id} className="flex justify-between text-xs items-center">
                      <span className="text-[#4A3226]/80 dark:text-[#F7E8DF]/75 line-clamp-1 max-w-[160px]">
                        {item.product.name} <span className="font-bold text-[10px] text-[#4A3226]/50 dark:text-[#F7E8DF]/50">x{item.quantity}</span>
                      </span>
                      <span className="font-semibold">{formatDirectPrice(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Coupon inputs */}
              <div className="pt-4 border-t border-[#C98A63]/20 dark:border-[#C98A63]/15">
                <form onSubmit={handleApplyCoupon} className="flex">
                  <input
                    type="text"
                    placeholder="COUPON (e.g. BLC10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full text-[10px] py-2 px-2.5 input-luxury rounded-l-xl rounded-r-none focus:ring-[#C98A63] focus:border-[#C98A63]"
                  />
                  <button
                    type="submit"
                    className="bg-[#C98A63] hover:bg-[#A86E4A] text-white font-semibold text-[10px] uppercase px-4 rounded-r-xl tracking-wider transition-colors"
                  >
                    Apply
                  </button>
                </form>
                {couponError && <p className="text-[10px] text-red-500 font-semibold mt-1">{couponError}</p>}
                
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-green-500/10 text-green-500 p-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider mt-3 border border-green-500/20">
                    <span className="flex items-center"><Tag className="w-3.5 h-3.5 mr-1.5" /> Code: {appliedCoupon}</span>
                    <button type="button" onClick={handleRemoveCoupon} className="text-red-500 hover:underline">Remove</button>
                  </div>
                )}

                {/* Info about available coupons */}
                <div className="text-[9px] text-[#4A3226]/70 dark:text-[#F7E8DF]/60 leading-relaxed mt-3 bg-[#F4DDD2]/30 dark:bg-[#120a06]/40 p-2 rounded-xl border border-[#C98A63]/20 dark:border-[#C98A63]/15">
                  🏷️ Available Coupons: <br />
                  • <span className="font-semibold text-[#4A3226] dark:text-neutral-300">BLC10</span> (10% off subtotal) <br />
                  • <span className="font-semibold text-[#4A3226] dark:text-neutral-300">LUXURY20</span> (20% off subtotal) <br />
                  • <span className="font-semibold text-[#4A3226] dark:text-neutral-300">WELCOME500</span> (₹500 flat discount)
                </div>
              </div>

              {/* Totals Summary */}
              <div className="pt-4 border-t border-[#C98A63]/20 dark:border-[#C98A63]/15 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4A3226]/75 dark:text-[#F7E8DF]/65">Subtotal</span>
                  <span className="font-semibold">{formatDirectPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Atelier Discount</span>
                    <span>-{formatDirectPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#4A3226]/75 dark:text-[#F7E8DF]/65">Delivery Charges</span>
                  <span className={`font-semibold ${shippingCharges === 0 ? 'text-green-500' : ''}`}>
                    {shippingCharges === 0 ? 'FREE' : formatDirectPrice(shippingCharges)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#C98A63]/20 dark:border-[#C98A63]/15 pt-3 font-bold text-base text-[#4A3226] dark:text-white">
                  <span>Grand Total</span>
                  <span className="text-[#C98A63]">{formatDirectPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting || items.length === 0}
                className="w-full flex items-center justify-center space-x-2 btn-luxury py-4 font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-lg mt-4 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{submitting ? 'Simulating order...' : 'Place Secure Order'}</span>
              </button>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Checkout;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_URL from '../apiConfig';
import { ArrowLeft, Truck, Package, ShieldCheck, MapPin, CheckCircle, ExternalLink } from 'lucide-react';

const TrackOrder = () => {
  const { id } = useParams();
  const token = useSelector((state) => state.auth.token);
  
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await axios.get(`${API_URL}/shipping/track/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrackingData(res.data);
      } catch (err) {
        console.error('Failed to load tracking data:', err);
        setError(err.response?.data?.message || 'Error loading shipment details');
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchTracking();
    }
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 py-16 px-4">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h2 className="font-playfair text-2xl font-bold text-red-500">Tracking Error</h2>
          <p className="text-neutral-500 text-sm">{error || 'Could not fetch order tracking records.'}</p>
          <Link to="/orders" className="inline-block bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest py-3 px-6 rounded">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const { orderStatus, courierName, awbCode, trackingUrl, expectedDelivery, milestones } = trackingData;

  // Expected timeline states (re-aligned to brand sequence)
  const timelineStages = [
    { key: 'Pending', label: 'Order Placed (Pending)', icon: Package },
    { key: 'Order Confirmed', label: 'Order Confirmed', icon: ShieldCheck },
    { key: 'Processing', label: 'Processing', icon: Package },
    { key: 'Ready to Ship', label: 'Ready to Ship', icon: Package },
    { key: 'Shipped', label: 'Shipped', icon: Truck },
    { key: 'Out for Delivery', label: 'Out for Delivery', icon: MapPin },
    { key: 'Delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const currentStageIndex = timelineStages.findIndex(s => String(s.key).toLowerCase() === String(orderStatus).toLowerCase());

  // Helper to determine if stage is active or completed
  const getStageStatusDetails = (stage, idx) => {
    const milestone = milestones.find(m => String(m.status).toLowerCase() === String(stage.key).toLowerCase());
    const date = milestone ? milestone.date : null;

    let state = 'upcoming'; // 'completed' | 'current' | 'upcoming'
    if (orderStatus === 'Cancelled' || orderStatus === 'Refunded' || orderStatus === 'Failed') {
      state = 'upcoming';
    } else if (currentStageIndex !== -1) {
      if (idx < currentStageIndex) {
        state = 'completed';
      } else if (idx === currentStageIndex) {
        state = 'current';
      }
    } else {
      if (milestone) {
        state = 'completed';
      }
    }

    return { state, date };
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors duration-300 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        {/* Navigation back */}
        <div className="mb-6">
          <Link to="/orders" className="text-xs uppercase tracking-widest font-bold flex items-center hover:text-luxury-gold-500 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Ledger
          </Link>
        </div>

        <div className="space-y-8">
          
          {/* Header reference */}
          <div className="border-b border-neutral-100 dark:border-neutral-900 pb-5">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Shipment Timeline</span>
            <h1 className="font-mono text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-1">
              #BLC2026{String(id).padStart(4, '0')}
            </h1>
            {orderStatus === 'Cancelled' && (
              <span className="inline-block mt-2 px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded border border-red-500/20">
                🔴 Cancelled Order
              </span>
            )}
            {orderStatus === 'Refunded' && (
              <span className="inline-block mt-2 px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase tracking-widest rounded border border-purple-500/20">
                🟣 Refunded Payment
              </span>
            )}
            {orderStatus === 'Failed' && (
              <span className="inline-block mt-2 px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded border border-red-500/20">
                🔴 Payment Failed
              </span>
            )}
          </div>

          {/* Timeline component */}
          <div className="bg-neutral-50 dark:bg-neutral-950 p-6 rounded-xl border border-neutral-100 dark:border-neutral-900">
            <h3 className="font-playfair text-lg font-bold text-neutral-800 dark:text-white mb-6 font-semibold">Status Log</h3>
            
            <div className="relative border-l-2 border-neutral-200 dark:border-neutral-900 ml-4 space-y-8 py-2">
              {timelineStages.map((stage, idx) => {
                const { state, date } = getStageStatusDetails(stage, idx);
                const IconComponent = stage.icon;

                // Color mappings
                let circleClass = '';
                let textClass = '';
                
                if (state === 'completed') {
                  circleClass = 'bg-green-500 border-green-500 text-white shadow-sm';
                  textClass = 'text-green-600 dark:text-green-400 font-bold';
                } else if (state === 'current') {
                  circleClass = 'bg-luxury-gold-500 border-luxury-gold-500 text-black shadow-[0_0_8px_rgba(201,138,99,0.5)] animate-pulse';
                  textClass = 'text-neutral-900 dark:text-white font-extrabold scale-[1.02] origin-left';
                } else {
                  circleClass = 'bg-white dark:bg-neutral-950 border-neutral-300 dark:border-neutral-850 text-neutral-400';
                  textClass = 'text-neutral-450 dark:text-neutral-550 font-medium';
                }

                return (
                  <div key={idx} className="relative pl-8">
                    {/* Circle marker */}
                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${circleClass}`}>
                      <IconComponent className={`w-2.5 h-2.5 ${state === 'current' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                    </div>

                    {/* Timeline card info */}
                    <div className="space-y-1">
                      <h4 className={`text-xs uppercase tracking-wider transition-colors ${textClass}`}>
                        {stage.label}
                      </h4>
                      {date ? (
                        <span className="text-[10px] text-neutral-400 font-mono block">
                          {new Date(date).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 block italic">Pending updates</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier Details panel */}
          {awbCode ? (
            <div className="bg-neutral-50 dark:bg-neutral-950 p-6 rounded-xl border border-neutral-100 dark:border-neutral-900 space-y-4">
              <h3 className="font-playfair text-lg font-bold text-neutral-800 dark:text-white pb-3 border-b border-neutral-200/60 dark:border-neutral-900 tracking-wide flex items-center">
                <Truck className="w-5 h-5 mr-2 text-luxury-gold-500" /> Dispatch Relations
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Courier Partner</span>
                  <span className="font-semibold text-neutral-850 dark:text-neutral-200">{courierName || 'BlueDart'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">AWB tracking number</span>
                  <span className="font-mono font-semibold text-neutral-850 dark:text-neutral-200">{awbCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Estimated Arrival</span>
                  <span className="font-semibold text-green-500">{expectedDelivery || '25 July'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Shipment Weight</span>
                  <span className="font-semibold text-neutral-850 dark:text-neutral-200">{trackingData.weight || '1.2 KG'}</span>
                </div>
              </div>

              {trackingUrl && (
                <div className="pt-4">
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 bg-black dark:bg-white text-white dark:text-black py-3 rounded font-semibold text-xs tracking-widest uppercase hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all duration-300"
                  >
                    <span>Track Live</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 bg-luxury-gold-500/5 border border-luxury-gold-500/10 rounded-xl text-xs text-neutral-500 dark:text-neutral-400 text-center leading-relaxed">
              🕰️ Order status is currently being verified. Shiprocket tracking IDs and AWB carrier assignments will load automatically here upon dispatch.
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default TrackOrder;

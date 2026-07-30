import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import API_URL from '../apiConfig';

const Contact = () => {
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');

  // Status message states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !mobile || !message) {
      setError('Please fill in all details');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`${API_URL}/contact/query`, { name, email, mobile, message });
      setSuccess('Your query has been submitted to the bloomluxecollection Relations team. We will contact you shortly.');
      setName('');
      setEmail('');
      setMobile('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors duration-300 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-luxury-gold-600 dark:text-luxury-gold-400 font-bold uppercase tracking-widest text-xs">
            Client Relations
          </span>
          <h1 className="font-playfair text-3xl md:text-4xl text-neutral-900 dark:text-white font-bold tracking-wide mt-2">
            Contact the Atelier
          </h1>
          <div className="w-16 h-0.5 bg-luxury-gold-500 mx-auto mt-4"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Contact details */}
          <div className="lg:col-span-1 space-y-8 bg-neutral-50 dark:bg-neutral-950 p-8 rounded-xl border border-neutral-100 dark:border-neutral-900">
            <h3 className="font-playfair text-xl font-bold tracking-wide text-neutral-800 dark:text-white mb-6">
              Our Offices
            </h3>

            <div className="flex items-start space-x-4">
              <MapPin className="w-5 h-5 text-luxury-gold-500 flex-shrink-0 mt-1" />
              <div>
                <h5 className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">Headquarters Atelier</h5>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  bloomluxecollection<br />
                  C-242, Harsh Vihar, Hari Nagar,<br />
                  Jaitpur, Badarpur, New Delhi – 110044
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Phone className="w-5 h-5 text-luxury-gold-500 flex-shrink-0 mt-1" />
              <div>
                <h5 className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">Client Phone Line</h5>
                <p className="text-xs text-neutral-500 mt-1">
                  Customer Support: +91 99999 99999
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Mail className="w-5 h-5 text-luxury-gold-500 flex-shrink-0 mt-1" />
              <div>
                <h5 className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">Digital Correspondence</h5>
                <p className="text-xs text-neutral-500 mt-1">
                  Email: <a href="mailto:bloomluxe.support@gmail.com" className="hover:text-luxury-gold-500 underline transition-colors">bloomluxe.support@gmail.com</a>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-neutral-950 p-8 rounded-xl border border-neutral-100 dark:border-neutral-900 shadow-md">
              <h3 className="font-playfair text-xl font-bold tracking-wide text-neutral-900 dark:text-white mb-6">
                Send Digital Message
              </h3>

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-xs text-green-500 mb-6 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-xs text-red-500 mb-6 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Full Name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs py-3.5 px-3 border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none focus:ring-1 focus:ring-luxury-gold-500 focus:border-luxury-gold-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="mobile" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Mobile Number</label>
                    <input
                      id="mobile"
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full text-xs py-3.5 px-3 border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none focus:ring-1 focus:ring-luxury-gold-500 focus:border-luxury-gold-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs py-3.5 px-3 border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none focus:ring-1 focus:ring-luxury-gold-500 focus:border-luxury-gold-500"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Message Content</label>
                  <textarea
                    id="message"
                    rows="5"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How may we assist you today?"
                    className="w-full text-xs p-3 border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none focus:ring-1 focus:ring-luxury-gold-500 focus:border-luxury-gold-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 hover:from-luxury-gold-500 hover:to-luxury-gold-400 text-black font-semibold text-xs tracking-widest uppercase py-3.5 px-8 rounded shadow transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Sending...' : 'Send Message'}</span>
                </button>

              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;

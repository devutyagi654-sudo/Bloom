import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_URL from '../../apiConfig';
import AdminLayout from '../../components/Admin/AdminLayout';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';

const ChangePassword = () => {
  const token = useSelector((state) => state.auth.token);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmNewPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/admin/change-password`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage({ type: 'success', text: res.data.message || 'Password changed successfully!' });
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div>
          <h1 className="font-playfair text-3xl font-bold tracking-wide text-neutral-900 dark:text-white">
            Security Settings
          </h1>
          <p className="text-neutral-400 text-xs mt-1 uppercase tracking-widest font-semibold">Update admin account login credentials</p>
        </div>

        <div className="max-w-lg">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200/65 dark:border-neutral-900 rounded-xl p-6 sm:p-8 shadow-sm">
            <h2 className="font-playfair text-xl font-bold text-[#4A3226] dark:text-[#F7E8DF] mb-6 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-luxury-gold-500" /> Change Admin Password
            </h2>

            {message.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-start space-x-2 text-xs font-semibold ${
                message.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current admin password"
                  required
                  className="w-full text-xs py-3 px-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-luxury-gold-500 focus:border-luxury-gold-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                  className="w-full text-xs py-3 px-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-luxury-gold-500 focus:border-luxury-gold-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  required
                  className="w-full text-xs py-3 px-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-luxury-gold-500 focus:border-luxury-gold-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 hover:from-luxury-gold-700 hover:to-luxury-gold-600 text-black py-3.5 px-6 rounded-lg text-xs font-bold uppercase tracking-wider shadow hover:shadow-md active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>

            </form>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default ChangePassword;

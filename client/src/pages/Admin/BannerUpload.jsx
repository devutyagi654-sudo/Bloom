import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_URL from '../../apiConfig';
import AdminLayout from '../../components/Admin/AdminLayout';
import { UploadCloud, Trash2, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

const BannerUpload = () => {
  const token = useSelector((state) => state.auth.token);

  // Active banners state
  const [banners, setBanners] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Form states
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Toast / Status states
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get active banners list
  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_URL}/banner`);
      setBanners(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load banners details', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Form input change handler
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setMessage({ type: '', text: '' });

    // Validate limit (up to 5 total banners)
    if (banners.length + files.length > 5) {
      setMessage({
        type: 'error',
        text: `Upload limit exceeded. You currently have ${banners.length} banner(s). You can upload up to ${5 - banners.length} more.`
      });
      return;
    }

    const validFiles = [];
    const previews = [];

    for (const file of files) {
      // Validate size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: `File "${file.name}" exceeds 5MB limit.` });
        return;
      }

      // Validate format
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: `File "${file.name}" has an unsupported format. JPG, PNG, WEBP only.` });
        return;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    setImageFiles(validFiles);
    setPreviewUrls(previews);
  };

  // Submit Handler
  const handleUpload = async (e) => {
    e.preventDefault();
    if (imageFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please select one or more image files to upload first.' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('banners', file); // Use key 'banners' as expected by backend array middleware
    });

    try {
      const res = await axios.post(`${API_URL}/admin/banner`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage({ type: 'success', text: res.data.message });
      setBanners(res.data.banners || []);
      
      // Reset inputs
      setImageFiles([]);
      setPreviewUrls([]);
      document.getElementById('banner-file-input').value = '';
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Banner upload failed. Try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    setMessage({ type: '', text: '' });
    try {
      const res = await axios.delete(`${API_URL}/admin/banner/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: res.data.message });
      setBanners(res.data.banners || []);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete banner'
      });
    }
  };

  const getFullUrl = (path) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${path}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Title */}
        <div>
          <h1 className="font-playfair text-3xl font-bold tracking-wide text-neutral-900 dark:text-white">
            Banner Settings
          </h1>
          <p className="text-neutral-400 text-xs mt-1 uppercase tracking-widest font-semibold">Configure homepage hero banners</p>
        </div>

        {/* Message Banner (Toast notification fallback) */}
        {message.text && (
          <div className={`p-4 rounded-xl border flex items-center text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-500'
              : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 mr-2.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2.5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Upload Form */}
          <div className="lg:col-span-1 bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-900 space-y-6">
            <div>
              <h3 className="font-playfair text-lg font-bold text-neutral-850 dark:text-white">
                Upload New Banner
              </h3>
              <p className="text-neutral-400 text-xs mt-1 font-light">JPG, PNG, or WEBP formats up to 5MB are accepted</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              
              {/* File Select & Drop Area */}
              <div className="space-y-2">
                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl p-8 text-center hover:border-luxury-gold-500 transition-colors relative cursor-pointer">
                  <input
                    id="banner-file-input"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                  <span className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    {imageFiles.length > 0 ? `${imageFiles.length} file(s) selected` : 'Select Banner Images'}
                  </span>
                  <span className="block text-[10px] text-neutral-400 mt-1 font-light">Recommended ratio: 16:9 or 21:9 (Hold Ctrl/Cmd to select multiple)</span>
                </div>
              </div>

              {/* Upload Button */}
              <button
                type="submit"
                disabled={submitting || imageFiles.length === 0}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 hover:from-luxury-gold-500 hover:to-luxury-gold-400 text-black py-3.5 rounded font-bold text-xs tracking-widest uppercase transition-all disabled:opacity-50 shadow-md animate-none"
              >
                <span>{submitting ? 'Uploading Banners...' : 'Upload Banners'}</span>
              </button>

            </form>

          </div>

          {/* Right panel: Active & Previews */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Image Previews (Before upload) */}
            {previewUrls.length > 0 && (
              <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-900 space-y-4">
                <h4 className="font-playfair text-sm font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2 text-luxury-gold-500 animate-pulse" /> Upload Previews ({previewUrls.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="aspect-[21/9] bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Currently Active Banners */}
            <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-900 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 pb-3">
                <h4 className="font-playfair text-sm font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  Active Homepage Banners ({banners.length}/5)
                </h4>
              </div>

              {fetchLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : banners.length > 0 ? (
                <div className="space-y-6">
                  {banners.map((banner, index) => (
                    <div key={banner.id} className="space-y-2 border-b border-neutral-100 dark:border-neutral-900 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400 font-mono">Banner #{index + 1} (ID: {banner.id})</span>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="text-[10px] text-red-500 hover:underline font-semibold flex items-center"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </button>
                      </div>
                      <div className="aspect-[21/9] bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow">
                        <img src={getFullUrl(banner.bannerPath)} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[9px] text-neutral-400 font-mono break-all select-all">
                        Path: {banner.bannerPath}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 bg-neutral-50 dark:bg-neutral-900/40 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg flex flex-col items-center justify-center text-center p-4">
                  <ImageIcon className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                  <p className="text-xs text-neutral-400">No active custom banners configured. The homepage hero section will be hidden until custom banners are uploaded.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </AdminLayout>
  );
};

export default BannerUpload;

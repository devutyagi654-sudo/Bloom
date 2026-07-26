import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_URL from '../../apiConfig';
import AdminLayout from '../../components/Admin/AdminLayout';
import { Plus, Edit2, Trash2, X, UploadCloud, AlertCircle } from 'lucide-react';
import { formatDirectPrice } from '../../utils/currency';

const ManageProducts = () => {
  const token = useSelector((state) => state.auth.token);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Input states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(10);
  const [isTrending, setIsTrending] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [limitedOffer, setLimitedOffer] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // Images saved in server already

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const prodRes = await axios.get(`${API_URL}/products`);
      setProducts(prodRes.data);
      const catRes = await axios.get(`${API_URL}/categories`);
      setCategories(catRes.data);
      if (catRes.data.length > 0) setCategory(catRes.data[0].name);
    } catch (err) {
      setError('Failed to load catalog database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    if (categories.length > 0) setCategory(categories[0].name);
    setStock(10);
    setIsTrending(false);
    setIsBestSeller(false);
    setIsFeatured(false);
    setIsNewArrival(false);
    setLimitedOffer(false);
    setImageFiles([]);
    setExistingImages([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingId(prod.id);
    setName(prod.name || '');
    setDescription(prod.description || '');
    setPrice(prod.price || '');
    setDiscountPrice(prod.discountPrice || '');
    setCategory(prod.category || '');
    setStock(prod.stock || 0);
    setIsTrending(prod.isTrending === true || String(prod.isTrending) === 'true');
    setIsBestSeller(prod.isBestSeller === true || String(prod.isBestSeller) === 'true');
    setIsFeatured(prod.isFeatured === true || String(prod.isFeatured) === 'true');
    setIsNewArrival(prod.isNewArrival === true || String(prod.isNewArrival) === 'true');
    setLimitedOffer(prod.limitedOffer === true || String(prod.limitedOffer) === 'true');
    setImageFiles([]);

    // Set existing images
    setExistingImages(Array.isArray(prod.images) ? prod.images : [prod.images].filter(Boolean));

    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(p => String(p.id) !== String(id)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (!name || !price || !category || stock === undefined) {
      setFormError('Name, price, category, and stock are required');
      setFormLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('discountPrice', discountPrice === '' ? '' : discountPrice);
    formData.append('category', category);
    formData.append('stock', stock);
    formData.append('isTrending', isTrending);
    formData.append('isBestSeller', isBestSeller);
    formData.append('isFeatured', isFeatured);
    formData.append('isNewArrival', isNewArrival);
    formData.append('limitedOffer', limitedOffer);

    // Images to keep in edit mode
    if (editingId) {
      formData.append('existingImages', JSON.stringify(existingImages));
    }

    // New uploaded files
    for (let i = 0; i < imageFiles.length; i++) {
      formData.append('images', imageFiles[i]);
    }

    try {
      let res;
      if (editingId) {
        // Edit Mode
        res = await axios.put(
          `${API_URL}/admin/products/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        // Add Mode
        res = await axios.post(
          `${API_URL}/admin/products`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      setIsModalOpen(false);
      fetchProductsAndCategories();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Submit failed. Please check inputs.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveExistingImage = (imgUrl) => {
    setExistingImages(existingImages.filter(img => img !== imgUrl));
  };

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold tracking-wide text-neutral-900 dark:text-white">
              Products Catalog
            </h1>
            <p className="text-neutral-400 text-xs mt-1 uppercase tracking-widest font-semibold">Create and manage your products database</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 hover:from-luxury-gold-500 hover:to-luxury-gold-400 text-black px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all self-start sm:self-auto shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-4 text-xs text-red-500 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 inline" />
            <span>{error}</span>
          </div>
        )}

        {/* Products Table List */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-900 rounded-xl shadow-sm">
            <p className="text-neutral-400 text-sm">No products found in database</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-900 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-900 text-neutral-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Thumbnail</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-medium">
                  {products.map((prod) => {
                    const images = Array.isArray(prod.images) ? prod.images : [prod.images].filter(Boolean);
                    const firstImage = images.length > 0
                      ? (images[0].startsWith('http') ? images[0] : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${images[0]}`)
                      : 'https://images.unsplash.com/photo-1543294001-f7cbfe92237e?w=100&auto=format&fit=crop&q=80';
                    return (
                      <tr key={prod.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                        <td className="py-3 px-4">
                          <img src={firstImage} alt={prod.name} className="w-10 h-12 object-cover rounded bg-neutral-200 dark:bg-neutral-900" />
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-playfair font-bold text-neutral-800 dark:text-neutral-200 text-sm">{prod.name}</span>
                          {/* Badges */}
                          <div className="flex space-x-1 mt-1 text-[8px] font-bold tracking-widest uppercase">
                            {(prod.isTrending === true || String(prod.isTrending) === 'true') && <span className="text-purple-500">Trending</span>}
                            {(prod.isBestSeller === true || String(prod.isBestSeller) === 'true') && <span className="text-luxury-gold-500">Bestseller</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-neutral-500">{prod.category}</td>
                        <td className="py-3 px-4 font-bold text-neutral-800 dark:text-neutral-200">
                          {prod.discountPrice ? (
                            <span className="space-x-1.5">
                              <span className="text-luxury-gold-600 dark:text-luxury-gold-400">{formatDirectPrice(prod.discountPrice)}</span>
                              <span className="text-neutral-400 line-through text-[10px] font-medium">{formatDirectPrice(prod.price)}</span>
                            </span>
                          ) : (
                            <span>{formatDirectPrice(prod.price)}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${Number(prod.stock) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {prod.stock} units
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Form Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-900 rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">

              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-playfair text-xl font-bold tracking-wide text-neutral-850 dark:text-white mb-6">
                {editingId ? 'Edit Product Ledger' : 'Add New Luxury Piece'}
              </h3>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-xs text-red-500 p-3.5 rounded-lg mb-4 font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs py-3.5 px-3 border border-neutral-300 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Description</label>
                  <textarea
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-3 border border-neutral-300 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Retail Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full text-xs py-3.5 px-3 border border-neutral-300 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none"
                    />
                  </div>
                  {/* Discount Price */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Discount Price (₹)</label>
                    <input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      className="w-full text-xs py-3.5 px-3 border border-neutral-300 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none"
                    />
                  </div>
                  {/* Stock */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Stock Count *</label>
                    <input
                      type="number"
                      required
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full text-xs py-3.5 px-3 border border-neutral-300 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category select */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Product Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs py-3 px-3 border border-neutral-300 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Flag checkboxes */}
                <div className="space-y-2 border-t border-b border-neutral-100 dark:border-neutral-900 py-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 col-span-full mb-1">Collections Flags</span>

                  <label className="flex items-center space-x-2 text-xs font-semibold">
                    <input type="checkbox" checked={isTrending} onChange={(e) => setIsTrending(e.target.checked)} className="rounded text-luxury-gold-500 focus:ring-luxury-gold-500" />
                    <span>Trending Collection</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold">
                    <input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} className="rounded text-luxury-gold-500 focus:ring-luxury-gold-500" />
                    <span>Best Seller</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold">
                    <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded text-luxury-gold-500 focus:ring-luxury-gold-500" />
                    <span>Featured Gallery</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold">
                    <input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} className="rounded text-luxury-gold-500 focus:ring-luxury-gold-500" />
                    <span>New Arrival</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold">
                    <input type="checkbox" checked={limitedOffer} onChange={(e) => setLimitedOffer(e.target.checked)} className="rounded text-luxury-gold-500 focus:ring-luxury-gold-500" />
                    <span>Limited time Offer</span>
                  </label>
                </div>

                {/* Existing images list (in edit mode) */}
                {editingId && existingImages.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Current Images</label>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((img, index) => {
                        const url = img.startsWith('http') ? img : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${img}`;
                        return (
                          <div key={index} className="relative w-16 h-20 bg-neutral-100 rounded border overflow-hidden">
                            <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(img)}
                              className="absolute top-1 right-1 p-0.5 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
                              title="Delete Image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upload Image Files */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Upload Product Images</label>
                  <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl p-6 text-center hover:border-luxury-gold-500 transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setImageFiles([...e.target.files])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <span className="block text-xs font-semibold">Select files to upload (Max 8 files)</span>
                    <span className="block text-[10px] text-neutral-400 mt-1 font-light">Supported formats: JPEG, PNG, WEBP</span>
                  </div>

                  {/* Selected files names list */}
                  {imageFiles.length > 0 && (
                    <div className="text-[10px] text-neutral-500 space-y-1 pt-2 font-medium">
                      <span className="font-bold uppercase tracking-widest text-[9px] text-neutral-400 block mb-1">Files Selected ({imageFiles.length})</span>
                      {imageFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="truncate">{file.name}</span>
                          <span className="text-[9px] text-neutral-400">({Math.round(file.size / 1024)} KB)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3 pt-4 border-t border-neutral-100 dark:border-neutral-900 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-3 px-6 text-neutral-500 font-bold text-xs uppercase tracking-widest border border-neutral-200 dark:border-neutral-800 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="py-3 px-6 bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 hover:from-luxury-gold-500 hover:to-luxury-gold-400 text-black font-bold text-xs uppercase tracking-widest rounded shadow transition-all disabled:opacity-50"
                  >
                    {formLoading ? 'Submitting...' : 'Save Product'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default ManageProducts;

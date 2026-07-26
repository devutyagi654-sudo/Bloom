import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_URL from '../../apiConfig';
import AdminLayout from '../../components/Admin/AdminLayout';
import { Plus, Edit2, Trash2, X, UploadCloud, AlertCircle } from 'lucide-react';

const ManageCategories = () => {
  const token = useSelector((state) => state.auth.token);
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Input states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setImageFile(null);
    setExistingImage('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingId(cat.id);
    setName(cat.name || '');
    setDescription(cat.description || '');
    setImageFile(null);
    setExistingImage(cat.image || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete category? WARNING: This will NOT delete products matching this category, but will orphan them.')) return;
    try {
      await axios.delete(`${API_URL}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(categories.filter(c => String(c.id) !== String(id)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (!name) {
      setFormError('Category name is required');
      setFormLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editingId) {
        await axios.put(
          `${API_URL}/admin/categories/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        await axios.post(
          `${API_URL}/admin/categories`,
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
      fetchCategories();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit category');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold tracking-wide text-neutral-900 dark:text-white">
              Category Settings
            </h1>
            <p className="text-neutral-400 text-xs mt-1 uppercase tracking-widest font-semibold">Organize products inside collections</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 hover:from-luxury-gold-500 hover:to-luxury-gold-400 text-black px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all self-start sm:self-auto shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-4 text-xs text-red-500 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 inline" />
            <span>{error}</span>
          </div>
        )}

        {/* Categories Table List */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-900 rounded-xl shadow-sm">
            <p className="text-neutral-400 text-sm">No categories found in database</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const imgUrl = cat.image?.startsWith('http') ? cat.image : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${cat.image}`;
              return (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200/60 dark:border-neutral-900 p-5 flex items-center justify-between shadow-sm hover:shadow transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg bg-neutral-200 dark:bg-neutral-900 overflow-hidden flex-shrink-0">
                      <img src={imgUrl} alt={cat.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-playfair font-bold text-base text-neutral-850 dark:text-neutral-200">{cat.name}</h3>
                      <p className="text-[10px] text-neutral-400 mt-1 line-clamp-1 max-w-[150px]">{cat.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Form Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-900 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
              
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-playfair text-xl font-bold tracking-wide text-neutral-850 dark:text-white mb-6">
                {editingId ? 'Edit Category' : 'Create Category'}
              </h3>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-xs text-red-500 p-3 rounded-lg mb-4 font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Category Name *</label>
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
                    rows="2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-3 border border-neutral-300 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none"
                  />
                </div>

                {/* Category Image upload */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Category Banner Image</label>
                  
                  {existingImage && !imageFile && (
                    <div className="w-16 h-16 rounded border overflow-hidden bg-neutral-100 mb-2">
                      <img src={existingImage.startsWith('http') ? existingImage : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${existingImage}`} alt="Current" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg p-4 text-center relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      {imageFile ? imageFile.name : 'Select file'}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3 pt-4 border-t border-neutral-100 dark:border-neutral-900 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2.5 px-5 text-neutral-500 font-bold text-xs uppercase tracking-widest border border-neutral-200 dark:border-neutral-800 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="py-2.5 px-5 bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 hover:from-luxury-gold-500 hover:to-luxury-gold-400 text-black font-bold text-xs uppercase tracking-widest rounded shadow transition-all disabled:opacity-50"
                  >
                    {formLoading ? 'Submitting...' : 'Save'}
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

export default ManageCategories;

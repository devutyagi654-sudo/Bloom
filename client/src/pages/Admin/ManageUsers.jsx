import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_URL from '../../apiConfig';
import AdminLayout from '../../components/Admin/AdminLayout';
import { ToggleLeft, ToggleRight, Trash2, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';

const ManageUsers = () => {
  const token = useSelector((state) => state.auth.token);
  const currentUser = useSelector((state) => state.auth.user);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleToggleRole = async (userObj) => {
    if (String(userObj.id) === String(currentUser.id)) {
      alert('You cannot demote yourself');
      return;
    }

    const newRole = userObj.role === 'admin' ? 'customer' : 'admin';
    if (!window.confirm(`Change ${userObj.fullName}'s role to ${newRole}?`)) return;

    try {
      const res = await axios.put(
        `${API_URL}/admin/users/${userObj.id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(users.map(u => String(u.id) === String(res.data.id) ? { ...u, role: res.data.role } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDelete = async (id) => {
    if (String(id) === String(currentUser.id)) {
      alert('You cannot delete your own account');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user? All their cart/wishlist sheets row references will remain but user records are deleted.')) return;

    try {
      await axios.delete(`${API_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(u => String(u.id) !== String(id)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div>
          <h1 className="font-playfair text-3xl font-bold tracking-wide text-neutral-900 dark:text-white">
            User Registry
          </h1>
          <p className="text-neutral-400 text-xs mt-1 uppercase tracking-widest font-semibold">Manage client accounts and authorization access</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-lg text-xs text-red-500 font-semibold">
            {error}
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-neutral-950 border border-neutral-200/65 dark:border-neutral-900 rounded-xl shadow-sm">
            <p className="text-neutral-400 text-sm">No registered users in database</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-900 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-900 text-neutral-400 uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-4">Client ID</th>
                    <th className="py-3.5 px-4">Full Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Mobile</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                      <td className="py-3.5 px-4 font-mono font-bold">#USR-{u.id}</td>
                      <td className="py-3.5 px-4 flex items-center">
                        <span>{u.fullName}</span>
                        {u.role === 'admin' && (
                          <ShieldCheck className="w-3.5 h-3.5 text-luxury-gold-500 ml-1.5" title="Administrator" />
                        )}
                        {String(u.id) === String(currentUser.id) && (
                          <span className="text-[8px] bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 rounded px-1 ml-1.5">You</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 flex items-center font-light">
                        <Mail className="w-3 h-3 mr-1 text-neutral-400" />
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 font-light">
                        <Phone className="w-3.5 h-3.5 mr-1 text-neutral-400 inline" />
                        {u.mobile}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                          u.role === 'admin' 
                            ? 'bg-luxury-gold-500/10 border-luxury-gold-500/20 text-luxury-gold-500' 
                            : 'bg-neutral-200/50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-850 text-neutral-500'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 flex items-center font-light">
                        <Calendar className="w-3 h-3 mr-1 text-neutral-400" />
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {/* Toggle admin button */}
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={String(u.id) === String(currentUser.id)}
                          className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
                            u.role === 'admin' ? 'text-luxury-gold-500 hover:bg-luxury-gold-500/10' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                          }`}
                          title="Toggle Admin Privilege"
                        >
                          {u.role === 'admin' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        
                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={String(u.id) === String(currentUser.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-30"
                          title="Remove Client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default ManageUsers;

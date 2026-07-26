import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_URL from '../../apiConfig';
import AdminLayout from '../../components/Admin/AdminLayout';
import { DollarSign, FileSpreadsheet, Package, Users, Mail, AlertTriangle, ArrowRight, Download, Upload, Clock, CheckCircle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';

const Dashboard = () => {
  const token = useSelector((state) => state.auth.token);
  
  // Tabs: overview or analytics
  const [activeTab, setActiveTab] = useState('overview');

  // Overview stats states
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Analytics states
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Import/Export States
  const [activeTable, setActiveTable] = useState('products');
  const [importFile, setImportFile] = useState(null);
  const [importMessage, setImportMessage] = useState({ type: '', text: '' });
  const [importLoading, setImportLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, token]);

  // Export Sheet Handler
  const handleExport = async (tableName) => {
    try {
      const res = await axios.get(`${API_URL}/admin/export/${tableName}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${tableName}.xlsx`;
      link.click();
    } catch (err) {
      alert('Failed to export sheet database');
    }
  };

  // Import Sheet Handler
  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImportLoading(true);
    setImportMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await axios.post(
        `${API_URL}/admin/import/${activeTable}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setImportMessage({ type: 'success', text: res.data.message });
      setImportFile(null);
      // Reset input element
      document.getElementById('import-file-input').value = '';
      // Refetch stats
      fetchStats();
    } catch (err) {
      setImportMessage({
        type: 'error',
        text: err.response?.data?.message || 'Import failed. Check columns format.'
      });
    } finally {
      setImportLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-24">
          <div className="w-12 h-12 border-4 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { name: 'Total Revenue', value: `₹${stats?.revenue?.toLocaleString() || 0}`, icon: DollarSign, color: 'text-green-500' },
    { name: "Today's Revenue", value: `₹${stats?.todayRevenue?.toLocaleString() || 0}`, icon: DollarSign, color: 'text-emerald-500' },
    { name: 'Total Orders', value: stats?.ordersCount || 0, icon: FileSpreadsheet, color: 'text-blue-500' },
    { name: "Today's Orders", value: stats?.todayOrdersCount || 0, icon: FileSpreadsheet, color: 'text-sky-500' },
    { name: 'Pending Orders', value: stats?.pendingOrdersCount || 0, icon: Clock, color: 'text-amber-505' },
    { name: 'Delivered Orders', value: stats?.deliveredOrdersCount || 0, icon: CheckCircle, color: 'text-green-600' },
    { name: 'Cancelled Orders', value: stats?.cancelledOrdersCount || 0, icon: AlertTriangle, color: 'text-red-500' },
    { name: 'Registered Customers', value: stats?.customersCount || 0, icon: Users, color: 'text-purple-500' }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Page Title & Tab Navigation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-100 dark:border-neutral-900 pb-5 gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold tracking-wide text-neutral-900 dark:text-white">
              Dashboard Analytics
            </h1>
            <p className="text-neutral-400 text-xs mt-1 uppercase tracking-widest font-semibold">Realtime statistics aggregated from Excel database</p>
          </div>

          <div className="flex border border-neutral-200 dark:border-neutral-900 rounded-lg overflow-hidden text-[10px] font-bold uppercase tracking-widest bg-neutral-50 dark:bg-neutral-950">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 transition-all ${
                activeTab === 'overview'
                  ? 'bg-black dark:bg-white text-white dark:text-black font-black'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Sheets Database
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-black dark:bg-white text-white dark:text-black font-black'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Analytics Charts
            </button>
          </div>
        </div>

        {/* Low Stock Warning Alert */}
        {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
          <div className="bg-red-550/10 border border-red-500/20 p-4 rounded-xl text-xs space-y-2">
            <span className="flex items-center text-red-500 font-bold uppercase tracking-wider text-[10px]">
              <AlertTriangle className="w-4 h-4 mr-1.5 animate-pulse" />
              INVENTORY ALERT: Low Stock Warnings
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {stats.lowStockProducts.map((prod, idx) => (
                <div key={idx} className="bg-white dark:bg-neutral-900 border border-red-500/10 p-2.5 rounded font-medium flex justify-between items-center text-neutral-800 dark:text-neutral-200">
                  <span className="truncate">{prod.name}</span>
                  <span className="text-red-500 font-bold ml-2">Only {prod.stock} left</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-900 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-xs text-neutral-400 font-bold uppercase tracking-widest block">{card.name}</span>
                  <span className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{card.value}</span>
                </div>
                <div className={`p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-8">
            {/* Database Export/Import Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Export Widget */}
              <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-900 space-y-6">
                <div>
                  <h3 className="font-playfair text-lg font-bold text-neutral-800 dark:text-white tracking-wide">
                    Export Excel Databases
                  </h3>
                  <p className="text-neutral-400 text-xs mt-1">Download raw spreadsheet sheets to backup or analyze offline</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['users', 'products', 'categories', 'orders', 'newsletter', 'contacts'].map((table) => (
                    <button
                      key={table}
                      onClick={() => handleExport(table)}
                      className="flex items-center justify-center space-x-2 py-3 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 rounded hover:border-luxury-gold-500 hover:text-luxury-gold-500 font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{table}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Import Widget */}
              <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-900 space-y-6">
                <div>
                  <h3 className="font-playfair text-lg font-bold text-neutral-800 dark:text-white tracking-wide">
                    Import Excel Update
                  </h3>
                  <p className="text-neutral-400 text-xs mt-1">Select table and upload formatted .xlsx spreadsheet to overwrite rows</p>
                </div>

                <form onSubmit={handleImport} className="space-y-4">
                  <div className="flex space-x-4">
                    <div className="w-1/2">
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Target Table</label>
                      <select
                        value={activeTable}
                        onChange={(e) => setActiveTable(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded focus:outline-none"
                      >
                        <option value="products">Products</option>
                        <option value="categories">Categories</option>
                        <option value="users">Users</option>
                        <option value="orders">Orders</option>
                        <option value="newsletter">Newsletter</option>
                      </select>
                    </div>
                    <div className="w-1/2">
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Spreadsheet File</label>
                      <input
                        id="import-file-input"
                        type="file"
                        accept=".xlsx"
                        required
                        onChange={(e) => setImportFile(e.target.files[0])}
                        className="w-full text-xs text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-neutral-200 dark:file:bg-neutral-800 file:text-xs file:font-semibold hover:file:opacity-80"
                      />
                    </div>
                  </div>

                  {importMessage.text && (
                    <p className={`text-xs font-semibold ${
                      importMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {importMessage.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={importLoading || !importFile}
                    className="w-full flex items-center justify-center space-x-2 bg-black dark:bg-white text-white dark:text-black py-3 rounded font-bold text-xs tracking-widest uppercase transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{importLoading ? 'Importing sheets...' : 'Upload & Overwrite'}</span>
                  </button>
                </form>
              </div>

            </div>

            {/* Recent Orders table */}
            <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-900 space-y-4">
              <h3 className="font-playfair text-lg font-bold text-neutral-800 dark:text-white tracking-wide">
                Recent Transactions
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-900 text-neutral-400 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-medium">
                    {stats?.recentOrders && stats.recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                        <td className="py-3.5 px-4 font-mono font-bold">#BLC-{ord.id}</td>
                        <td className="py-3.5 px-4">{ord.fullName}</td>
                        <td className="py-3.5 px-4">{new Date(ord.createdAt).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 font-bold text-luxury-gold-600 dark:text-luxury-gold-400">₹{Number(ord.totalAmount).toLocaleString()}</td>
                        <td className="py-3.5 px-4 uppercase text-[10px] tracking-wider">{ord.paymentMethod} ({ord.paymentStatus})</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                            ord.orderStatus === 'Delivered' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {ord.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-neutral-400">No orders recorded in database</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Recharts Analytics tab charts rendering */
          analyticsLoading || !analytics ? (
            <div className="flex justify-center py-24">
              <div className="w-12 h-12 border-4 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Row: Revenue Area Chart & Orders Bar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Area Chart */}
                <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-900 shadow-sm space-y-4">
                  <h3 className="font-playfair text-base font-bold text-neutral-800 dark:text-white tracking-wide">
                    Monthly Revenue Trend
                  </h3>
                  <div className="h-64 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.monthlyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#b47248" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#b47248" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                        <XAxis dataKey="month" stroke="#888888" />
                        <YAxis stroke="#888888" tickFormatter={(val) => `₹${val}`} />
                        <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#b47248" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Orders Status Bar Chart */}
                <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-900 shadow-sm space-y-4">
                  <h3 className="font-playfair text-base font-bold text-neutral-800 dark:text-white tracking-wide">
                    Fulfillment Logs Distribution
                  </h3>
                  <div className="h-64 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.ordersByStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                        <XAxis dataKey="status" stroke="#888888" />
                        <YAxis stroke="#888888" allowDecimals={false} />
                        <Tooltip formatter={(value) => [value, 'OrdersCount']} />
                        <Bar dataKey="count" fill="#dda075" radius={[4, 4, 0, 0]}>
                          {analytics.ordersByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#b47248' : '#dda075'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bottom Row: COD vs Online Pie Chart & Top lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pie Chart COD vs Online */}
                <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-900 shadow-sm space-y-4 flex flex-col justify-between">
                  <h3 className="font-playfair text-base font-bold text-neutral-800 dark:text-white tracking-wide">
                    COD vs Online Gateway Split
                  </h3>
                  <div className="h-48 w-full text-[10px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.paymentMethodSplit}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                        >
                          <Cell fill="#b47248" />
                          <Cell fill="#dda075" />
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} Orders`, 'Fractions']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                        {analytics.paymentMethodSplit.reduce((a, b) => a + b.value, 0)}
                      </span>
                      <span className="text-[8px] uppercase tracking-widest text-neutral-400">Total Sales</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex justify-center space-x-6 text-[10px] font-semibold">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 bg-[#b47248] rounded"></div>
                      <span>COD ({analytics.paymentMethodSplit[0]?.value || 0})</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 bg-[#dda075] rounded"></div>
                      <span>Online ({analytics.paymentMethodSplit[1]?.value || 0})</span>
                    </div>
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-900 shadow-sm space-y-4 col-span-1 lg:col-span-2">
                  <h3 className="font-playfair text-base font-bold text-neutral-800 dark:text-white tracking-wide">
                    Top 5 Selling Atelier Products
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-900 text-neutral-400 uppercase tracking-wider font-bold">
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3 text-center">Units Sold</th>
                          <th className="py-2.5 px-3 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-medium">
                        {analytics.topProducts.map((prod, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                            <td className="py-2 px-3">{prod.name}</td>
                            <td className="py-2 px-3 text-center font-semibold text-neutral-500">{prod.quantity} units</td>
                            <td className="py-2 px-3 text-right font-bold text-luxury-gold-600 dark:text-luxury-gold-400">₹{prod.revenue.toLocaleString()}</td>
                          </tr>
                        ))}
                        {analytics.topProducts.length === 0 && (
                          <tr>
                            <td colSpan="3" className="py-6 text-center text-neutral-400">No items statistics recorded yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

      </div>
    </AdminLayout>
  );
};

export default Dashboard;

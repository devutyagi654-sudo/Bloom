import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FolderTree, FileSpreadsheet, Users, Mail, ArrowLeft, Image } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const location = useLocation();

  const sidebarLinks = [
    { name: 'Dashboard Stats', path: '/admin', icon: LayoutDashboard },
    { name: 'Products Catalog', path: '/admin/products', icon: ShoppingBag },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Order Logs', path: '/admin/orders', icon: FileSpreadsheet },
    { name: 'User Registry', path: '/admin/users', icon: Users },
    { name: 'Banner Upload', path: '/admin/banner', icon: Image }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors duration-300 flex flex-col md:flex-row">
      
      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-900 md:min-h-screen p-6 flex flex-col justify-between">
        <div className="space-y-8">
          
          {/* Header/Back link */}
          <div className="space-y-1">
            <Link to="/" className="flex items-center text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-luxury-gold-500 transition-colors mb-3">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Store Home
            </Link>
            <h2 className="font-playfair text-2xl font-black tracking-widest bg-gradient-to-r from-luxury-gold-600 via-luxury-gold-400 to-luxury-gold-700 bg-clip-text text-transparent">
              ATELIER ADMIN
            </h2>
            <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-400 dark:text-neutral-600">Administrative Suite</span>
          </div>

          {/* Links list */}
          <ul className="space-y-2">
            {sidebarLinks.map((link, i) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <li key={i}>
                  <Link
                    to={link.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 text-black shadow font-black'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-luxury-gold-500'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

        </div>

        {/* Footer info */}
        <div className="text-[10px] text-neutral-400 mt-12 pt-6 border-t border-neutral-100 dark:border-neutral-900">
          📍 Connected Database: <br />
          <span className="font-mono text-neutral-500">Excel /server/database/*.xlsx</span>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;

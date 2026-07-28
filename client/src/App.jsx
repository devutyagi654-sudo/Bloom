import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadProfile } from './redux/authSlice';

// Common Components
import AnnouncementBar from './components/Common/AnnouncementBar';
import Navbar from './components/Common/Navbar';
import Footer from './components/Common/Footer';
import ProtectedRoute from './components/Common/ProtectedRoute';

// Customer Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import Contact from './pages/Contact';
import TrackOrder from './pages/TrackOrder';

// Admin Pages
import Dashboard from './pages/Admin/Dashboard';
import ManageProducts from './pages/Admin/ManageProducts';
import ManageCategories from './pages/Admin/ManageCategories';
import ManageOrders from './pages/Admin/ManageOrders';
import ManageUsers from './pages/Admin/ManageUsers';
import BannerUpload from './pages/Admin/BannerUpload';
import ChangePassword from './pages/Admin/ChangePassword';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(loadProfile());
    }
  }, [dispatch]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors duration-300">

        {/* Global Header */}
        <div className="sticky top-0 z-50 w-full flex flex-col shadow-sm">
          <AnnouncementBar />
          <Navbar />
        </div>

        {/* Dynamic Route Pages */}
        <div className="flex-grow">
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/contact" element={<Contact />} />

            {/* Protected Customer Routes */}
            <Route path="/cart" element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } />
            <Route path="/wishlist" element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/order-success/:id" element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            } />
            <Route path="/orders/track/:id" element={
              <ProtectedRoute>
                <TrackOrder />
              </ProtectedRoute>
            } />


            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute adminOnly={true}>
                <ManageProducts />
              </ProtectedRoute>
            } />
            <Route path="/admin/categories" element={
              <ProtectedRoute adminOnly={true}>
                <ManageCategories />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute adminOnly={true}>
                <ManageOrders />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly={true}>
                <ManageUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/banner" element={
              <ProtectedRoute adminOnly={true}>
                <BannerUpload />
              </ProtectedRoute>
            } />
            <Route path="/admin/change-password" element={
              <ProtectedRoute adminOnly={true}>
                <ChangePassword />
              </ProtectedRoute>
            } />

            {/* Fallback Route */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>

        {/* Global Footer */}
        <Footer />

      </div>
    </Router>
  );
}

export default App;

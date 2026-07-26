import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-luxury-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and store source URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isUserAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  if (adminOnly && !isUserAdmin) {
    // Redirect to homepage
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

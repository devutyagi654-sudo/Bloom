import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../redux/authSlice';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { isAuthenticated, error, loading } = useSelector((state) => state.auth);

  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');

  // Destination path after login
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    // Clear error on mount
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!emailOrMobile || !password) return;
    dispatch(loginUser({ emailOrMobile, password }));
  };

  return (
    <div className="min-h-[80vh] bg-[#F7E8DF]/40 dark:bg-[#1E130D]/40 text-[#4A3226] dark:text-[#F7E8DF] transition-colors duration-300 flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full card-luxury p-8 relative overflow-hidden">
        
        {/* Subtle decorative purple blur */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#C98A63]/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Brand identity */}
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-playfair font-black tracking-widest bg-gradient-to-r from-[#A86E4A] via-[#C98A63] to-[#F2CDBD] bg-clip-text text-transparent">
            BLOOM
          </Link>
          <h2 className="font-playfair text-xl font-bold tracking-wide mt-3 text-[#4A3226] dark:text-white">
            Client Authentication
          </h2>
          <p className="text-xs text-[#4A3226]/50 dark:text-[#F7E8DF]/40 font-light mt-1.5 uppercase tracking-widest">
            Enter details to access your atelier account
          </p>
        </div>

        {/* Errors display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3 text-xs text-red-500 flex items-center mb-6 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email or Mobile */}
          <div>
            <label htmlFor="emailOrMobile" className="block text-xs font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1.5">
              Email or Mobile Number
            </label>
            <div className="relative">
              <input
                id="emailOrMobile"
                type="text"
                required
                value={emailOrMobile}
                onChange={(e) => setEmailOrMobile(e.target.value)}
                placeholder="client@bloom.com or 9876543210"
                className="w-full text-xs py-3.5 pl-10 pr-3 input-luxury rounded-full focus:ring-[#C98A63] focus:border-[#C98A63]"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C98A63]" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs py-3.5 pl-10 pr-3 input-luxury rounded-full focus:ring-[#C98A63] focus:border-[#C98A63]"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C98A63]" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 btn-luxury py-3.5 mt-8 font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>

        </form>

        {/* Footer info link */}
        <div className="text-center mt-8 pt-6 border-t border-[#C98A63]/25 dark:border-[#C98A63]/15 text-xs">
          <span className="text-[#4A3226]/60 dark:text-[#F7E8DF]/50 font-medium">New to Bloom? </span>
          <Link to="/register" className="text-[#C98A63] font-semibold underline hover:text-[#A86E4A] transition-colors">
            Register Account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;

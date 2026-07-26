import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../redux/authSlice';
import { User, Mail, Phone, Lock, UserPlus, AlertCircle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, error, loading } = useSelector((state) => state.auth);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!fullName || !email || !mobile || !password || !confirmPassword) {
      setValidationError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }

    // Call register API thunk
    dispatch(registerUser({ fullName, email, mobile, password, confirmPassword }));
  };

  return (
    <div className="min-h-[85vh] bg-[#F7E8DF]/40 dark:bg-[#1E130D]/40 text-[#4A3226] dark:text-[#F7E8DF] transition-colors duration-300 flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full card-luxury p-8 relative overflow-hidden">
        
        {/* Subtle decorative purple blur */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#C98A63]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Brand identity */}
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-playfair font-black tracking-widest bg-gradient-to-r from-[#A86E4A] via-[#C98A63] to-[#F2CDBD] bg-clip-text text-transparent">
            BLOOM
          </Link>
          <h2 className="font-playfair text-xl font-bold tracking-wide mt-3 text-[#4A3226] dark:text-white">
            Client Registry
          </h2>
          <p className="text-xs text-[#4A3226]/50 dark:text-[#F7E8DF]/40 font-light mt-1.5 uppercase tracking-widest">
            Create an account to track orders & save items
          </p>
        </div>

        {/* Validation or API Errors display */}
        {(validationError || error) && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3 text-xs text-red-500 flex items-center mb-6 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
              Full Name
            </label>
            <div className="relative">
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Eleanor Vance"
                className="w-full text-xs py-3.5 pl-10 pr-3 input-luxury rounded-full focus:ring-[#C98A63] focus:border-[#C98A63]"
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C98A63]" />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eleanor@example.com"
                className="w-full text-xs py-3.5 pl-10 pr-3 input-luxury rounded-full focus:ring-[#C98A63] focus:border-[#C98A63]"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C98A63]" />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label htmlFor="mobile" className="block text-xs font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <input
                id="mobile"
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                className="w-full text-xs py-3.5 pl-10 pr-3 input-luxury rounded-full focus:ring-[#C98A63] focus:border-[#C98A63]"
              />
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C98A63]" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full text-xs py-3.5 pl-10 pr-3 input-luxury rounded-full focus:ring-[#C98A63] focus:border-[#C98A63]"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C98A63]" />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-widest text-[#4A3226]/60 dark:text-[#F7E8DF]/50 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full text-xs py-3.5 pl-10 pr-3 input-luxury rounded-full focus:ring-[#C98A63] focus:border-[#C98A63]"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C98A63]" />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 btn-luxury py-3.5 font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow disabled:opacity-50 mt-6"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Creating Account...' : 'Register'}</span>
          </button>

        </form>

        {/* Footer info link */}
        <div className="text-center mt-8 pt-6 border-t border-[#C98A63]/25 dark:border-[#C98A63]/15 text-xs">
          <span className="text-[#4A3226]/60 dark:text-[#F7E8DF]/50 font-medium">Already registered? </span>
          <Link to="/login" className="text-[#C98A63] font-semibold underline hover:text-[#A86E4A] transition-colors">
            Login Now
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;

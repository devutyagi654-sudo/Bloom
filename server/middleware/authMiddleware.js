const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'blc_premium_luxury_ecommerce_secret_key_2026');
      
      if (decoded.id === 'admin') {
        req.user = {
          id: 'admin',
          _id: 'admin',
          fullName: 'Atelier Admin',
          email: 'admin@blc.com',
          mobile: '9999999999',
          role: 'ADMIN'
        };
        return next();
      }
      
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      const userObj = user.toObject();
      userObj.role = (userObj.email === 'admin@blc.com') ? 'ADMIN' : 'USER';
      
      req.user = userObj;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: '403 Forbidden' });
  }
};

const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'blc_premium_luxury_ecommerce_secret_key_2026');

      if (decoded.id === 'admin') {
        req.user = {
          id: 'admin',
          _id: 'admin',
          fullName: 'Atelier Admin',
          email: 'admin@blc.com',
          mobile: '9999999999',
          role: 'ADMIN'
        };
        return next();
      }

      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        const userObj = user.toObject();
        userObj.role = (userObj.email === 'admin@blc.com') ? 'ADMIN' : 'USER';
        req.user = userObj;
        return next();
      }
    } catch (error) {
      console.warn('Optional auth token verify failed, falling back to guest mode:', error.message);
    }
  }

  // Guest session fallback
  const guestHeader = req.headers['x-guest-session-id'] || req.body?.guestSessionId;
  const guestId = guestHeader ? String(guestHeader).trim() : 'guest_' + Date.now();

  req.user = {
    id: guestId,
    _id: guestId,
    role: 'GUEST',
    isGuest: true
  };
  next();
};

module.exports = { protect, adminOnly, optionalAuth };

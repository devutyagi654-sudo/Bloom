const jwt = require('jsonwebtoken');
const { getTableData } = require('../config/db');

const protect = (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'blc_premium_luxury_ecommerce_secret_key_2026');
      
      if (decoded.id === 'admin') {
        req.user = {
          id: 'admin',
          fullName: 'Atelier Admin',
          email: 'admin@blc.com',
          mobile: '9999999999',
          role: 'ADMIN'
        };
        return next();
      }
      
      const users = getTableData('users.xlsx');
      const user = users.find(u => String(u.id) === String(decoded.id));
      
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      // Don't include password in request object
      const { password, ...userWithoutPassword } = user;
      // Convert role to uppercase 'ADMIN' or 'USER' (strictly restricted to admin@blc.com email)
      userWithoutPassword.role = (userWithoutPassword.email === 'admin@blc.com') ? 'ADMIN' : 'USER';
      
      req.user = userWithoutPassword;
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
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ message: '403 Forbidden' });
  }
};

module.exports = { protect, adminOnly };

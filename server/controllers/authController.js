const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getTableData, insertRow } = require('../config/db');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'blc_premium_luxury_ecommerce_secret_key_2026', {
    expiresIn: '30d'
  });
};

// Register User
const registerUser = async (req, res) => {
  try {
    const { fullName, email, mobile, password, confirmPassword } = req.body;
    
    if (!fullName || !email || !mobile || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    const users = getTableData('users.xlsx');
    
    // Check if email already exists
    const emailExists = users.some(u => String(u.email).toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Check if mobile already exists
    const mobileExists = users.some(u => String(u.mobile) === String(mobile));
    if (mobileExists) {
      return res.status(400).json({ message: 'User with this mobile number already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Strict requirement: new registration is ALWAYS role USER
    const role = 'USER';
    
    const newUser = insertRow('users.xlsx', {
      fullName,
      email: email.toLowerCase(),
      mobile,
      password: hashedPassword,
      role: 'user' // lowercase in xlsx
    });
    
    return res.status(201).json({
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      mobile: newUser.mobile,
      role: role,
      token: generateToken(newUser.id, role)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;
    
    if (!emailOrMobile || !password) {
      return res.status(400).json({ message: 'Please enter all credentials' });
    }
    
    // Check for strict hardcoded admin credentials
    if (emailOrMobile.toLowerCase() === 'admin@blc.com') {
      if (password === 'admin9090') {
        const adminId = 'admin';
        const token = generateToken(adminId, 'ADMIN');
        return res.json({
          id: adminId,
          fullName: 'Atelier Admin',
          email: 'admin@blc.com',
          mobile: '9999999999',
          role: 'ADMIN',
          token
        });
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }
    
    const users = getTableData('users.xlsx');
    
    // Find user by email OR mobile
    const user = users.find(u => 
      String(u.email).toLowerCase() === emailOrMobile.toLowerCase() || 
      String(u.mobile) === String(emailOrMobile)
    );
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Your account has been disabled by the administrator' });
    }
    
    // Force role USER for all logins other than admin@blc.com/admin9090
    const mappedRole = 'USER';
    
    return res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      role: mappedRole,
      token: generateToken(user.id, mappedRole)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    // Check for bypass admin session
    if (String(req.user?.id) === 'admin' || req.user?.email === 'admin@blc.com') {
      return res.json({
        id: 'admin',
        fullName: 'Atelier Admin',
        email: 'admin@blc.com',
        mobile: '9999999999',
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      });
    }

    const users = getTableData('users.xlsx');
    const user = users.find(u => String(u.id) === String(req.user.id));
    
    if (user) {
      // Force role USER for all database profiles
      const mappedRole = 'USER';
      return res.json({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: mappedRole,
        createdAt: user.createdAt
      });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error fetching profile' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};

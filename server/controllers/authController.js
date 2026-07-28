const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    
    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Check if mobile already exists
    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({ message: 'User with this mobile number already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const role = 'USER';
    
    const newUser = await User.create({
      fullName,
      email: email.toLowerCase(),
      mobile,
      password: hashedPassword,
      role: 'USER'
    });
    
    return res.status(201).json({
      id: newUser._id,
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      mobile: newUser.mobile,
      role: role,
      token: generateToken(newUser._id, role)
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
    
    // Find user by email OR mobile
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile }
      ]
    });
    
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
    
    const isAdmin = String(user.email).toLowerCase() === 'admin@blc.com' || String(user.role).toLowerCase() === 'admin';
    const mappedRole = isAdmin ? 'ADMIN' : 'USER';
    const finalUserId = isAdmin ? 'admin' : user._id;
    
    return res.json({
      id: finalUserId,
      _id: finalUserId,
      fullName: user.fullName || 'Atelier Admin',
      email: user.email,
      mobile: user.mobile,
      role: mappedRole,
      token: generateToken(finalUserId, mappedRole)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    if (String(req.user?.id) === 'admin' || req.user?.email === 'admin@blc.com') {
      return res.json({
        id: 'admin',
        _id: 'admin',
        fullName: 'Atelier Admin',
        email: 'admin@blc.com',
        mobile: '9999999999',
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      });
    }

    const user = await User.findById(req.user.id || req.user._id);
    
    if (user) {
      const mappedRole = (user.email === 'admin@blc.com') ? 'ADMIN' : 'USER';
      return res.json({
        id: user._id,
        _id: user._id,
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

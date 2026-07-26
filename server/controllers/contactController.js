const { getTableData, insertRow } = require('../config/db');

// Submit Contact Query
const submitContact = async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body;
    
    if (!name || !email || !mobile || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const newContact = insertRow('contacts.xlsx', {
      name,
      email: email.toLowerCase(),
      mobile,
      message,
      status: 'unread'
    });
    
    return res.status(201).json({ message: 'Query submitted successfully', query: newContact });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error submitting query' });
  }
};

// Subscribe Newsletter
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    
    const newsletter = getTableData('newsletter.xlsx');
    const exists = newsletter.some(n => String(n.email).toLowerCase() === email.toLowerCase());
    
    if (exists) {
      return res.status(400).json({ message: 'This email is already subscribed' });
    }
    
    const subscription = insertRow('newsletter.xlsx', {
      email: email.toLowerCase()
    });
    
    return res.status(201).json({ message: 'Subscribed to newsletter successfully', subscription });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error subscribing to newsletter' });
  }
};

module.exports = {
  submitContact,
  subscribeNewsletter
};

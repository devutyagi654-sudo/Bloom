const Contact = require('../models/Contact');
const Newsletter = require('../models/Newsletter');

// Submit Contact Query
const submitContact = async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body;
    
    if (!name || !email || !mobile || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const newContact = await Contact.create({
      name,
      email: email.toLowerCase(),
      mobile,
      message,
      status: 'unread'
    });
    
    const obj = newContact.toObject();
    obj.id = obj._id;

    return res.status(201).json({ message: 'Query submitted successfully', query: obj });
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
    
    const exists = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (exists) {
      return res.status(400).json({ message: 'This email is already subscribed' });
    }
    
    const subscription = await Newsletter.create({
      email: email.toLowerCase()
    });

    const obj = subscription.toObject();
    obj.id = obj._id;
    
    return res.status(201).json({ message: 'Subscribed to newsletter successfully', subscription: obj });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error subscribing to newsletter' });
  }
};

module.exports = {
  submitContact,
  subscribeNewsletter
};

const axios = require('axios');

// Read Shiprocket Env Credentials
const getCredentials = () => {
  const email = (process.env.SHIPROCKET_EMAIL || '').trim();
  const password = (process.env.SHIPROCKET_PASSWORD || '').trim();
  return { email, password };
};

// Check if credentials are set and non-placeholder
const isShiprocketConfigured = () => {
  const { email, password } = getCredentials();
  return Boolean(
    email && 
    password && 
    email !== 'your_shiprocket_email' && 
    password !== 'your_shiprocket_password'
  );
};

// Token cache memory
let shiprocketToken = null;
let tokenExpiry = null;

/**
 * Generates and returns a valid Shiprocket Bearer Token.
 * Automatically refreshes token when expired.
 * @returns {Promise<string|null>} Bearer Token or null if not configured/auth fails
 */
const getShiprocketToken = async () => {
  if (!isShiprocketConfigured()) {
    console.log('[SHIPROCKET] Credentials not configured in .env. Running in simulated mode.');
    return null;
  }

  // Return cached token if valid (buffer of 24 hours before 10-day expiration)
  if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
    return shiprocketToken;
  }

  const { email, password } = getCredentials();

  try {
    console.log('[SHIPROCKET] Authenticating with Shiprocket API...');
    const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email,
      password
    });

    if (response.data && response.data.token) {
      shiprocketToken = response.data.token;
      // Shiprocket tokens expire in 10 days; refresh 1 day early (9 days expiry)
      tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
      console.log('[SHIPROCKET] Authentication successful. Token cached.');
      return shiprocketToken;
    } else {
      console.error('[SHIPROCKET] Auth response missing token:', response.data);
      return null;
    }
  } catch (error) {
    console.error('[SHIPROCKET] Authentication Failed:', error.response?.data || error.message);
    return null;
  }
};

module.exports = {
  getShiprocketToken,
  isShiprocketConfigured
};

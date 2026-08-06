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
    password !== 'your_shiprocket_password' &&
    email.includes('@')
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
  console.log('--- SHIPROCKET AUTHENTICATION ---');
  
  if (!isShiprocketConfigured()) {
    const { email } = getCredentials();
    console.warn('[SHIPROCKET_AUTH_WARN] Shiprocket credentials not properly configured in environment variables.');
    console.warn(`[SHIPROCKET_AUTH_WARN] Configured Email: "${email || 'MISSING'}"`);
    return null;
  }

  // Return cached token if valid (buffer of 24 hours before 10-day expiration)
  if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
    console.log('[SHIPROCKET_AUTH] Using valid cached Bearer Token.');
    return shiprocketToken;
  }

  const { email, password } = getCredentials();

  try {
    console.log(`[SHIPROCKET_AUTH] Requesting new Bearer Token from Shiprocket API for: ${email}`);
    
    const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email,
      password
    });

    console.log(`[SHIPROCKET_AUTH_RESPONSE] HTTP Status Code: ${response.status}`);

    if (response.data && response.data.token) {
      shiprocketToken = response.data.token;
      // Shiprocket tokens expire in 10 days; refresh 1 day early (9 days expiry)
      tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
      
      console.log('[SHIPROCKET_AUTH_SUCCESS] Shiprocket authentication successful. Bearer token cached.');
      console.log(`[SHIPROCKET_AUTH_TOKEN] Token Prefix: ${shiprocketToken.substring(0, 15)}...`);
      return shiprocketToken;
    } else {
      console.error('[SHIPROCKET_AUTH_ERROR] Authentication response missing token payload:', JSON.stringify(response.data));
      return null;
    }
  } catch (error) {
    console.error('[SHIPROCKET_AUTH_ERROR] Authentication Failed:');
    console.error('Error Message:', error.message);
    if (error.response) {
      console.error('HTTP Status Code:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
};

module.exports = {
  getShiprocketToken,
  isShiprocketConfigured
};

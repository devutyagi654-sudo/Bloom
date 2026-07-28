const mongoose = require('mongoose');

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('[DB FATAL] MONGODB_URI environment variable is not defined.');
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  try {
    console.log('[DB] Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`[DB] Connected successfully to MongoDB Atlas: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('[DB FATAL] Failed to connect to MongoDB Atlas:', error.message);
    throw error;
  }
};

module.exports = {
  connectDB
};

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    await conn.connection.db.admin().command({ ping: 1 });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    const message = error?.message || 'Unknown MongoDB error';

    if (message.toLowerCase().includes('auth required') || message.toLowerCase().includes('authentication failed')) {
      console.error('❌ MongoDB authentication failed. Check MONGODB_URI username/password and URL encoding.');
    } else {
      console.error(`❌ MongoDB connection error: ${message}`);
    }

    process.exit(1);
  }
};

module.exports = { connectDB };

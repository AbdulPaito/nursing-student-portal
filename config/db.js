const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  const maxAttempts = parseInt(process.env.MONGODB_CONNECT_MAX_ATTEMPTS || '20', 10);
  const delayMs = parseInt(process.env.MONGODB_CONNECT_RETRY_DELAY_MS || '5000', 10);

  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        maxPoolSize: 10
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      lastErr = err;
      console.error(`MongoDB connect attempt ${attempt}/${maxAttempts} failed:`, err && err.message ? err.message : err);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  throw lastErr || new Error('MongoDB connection failed');
};

module.exports = connectDB;

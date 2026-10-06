const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MongoDB URI is not defined. Running without DB.');
    return;
  }

  const tryConnect = async () => {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`❌ MongoDB connection failed: ${error.message}`);
      console.log('⏳ Retrying in 5 seconds...');
      setTimeout(tryConnect, 5000);
    }
  };

  await tryConnect();
};

module.exports = connectDB;

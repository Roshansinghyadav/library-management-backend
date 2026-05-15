const mongoose = require('mongoose');

const connectDB = async () => {
  const atlasURI = process.env.MONGO_URI;
  const localURI = 'mongodb://127.0.0.1:27017/lms_db';

  const attachListeners = () => {
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected.');
    });
    mongoose.connection.on('error', (err) => {
      console.error('❔ MongoDB connection error:', err);
    });
  };

  try {
    const conn = await mongoose.connect(atlasURI, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Connected (Atlas): ${conn.connection.host}`);
    attachListeners();
    return conn;
  } catch (atlasErr) {
    console.warn('⚠️  Atlas connection failed – trying local MongoDB...');
    console.warn(atlasErr.message);
    try {
      const conn = await mongoose.connect(localURI, { serverSelectionTimeoutMS: 5000 });
      console.log(`✅ MongoDB Connected (Local): ${conn.connection.host}`);
      attachListeners();
      return conn;
    } catch (localErr) {
      console.error('❌ Both Atlas and local MongoDB connections failed:');
      console.error(localErr.message);
      throw localErr;
    }
  }
};

module.exports = connectDB;

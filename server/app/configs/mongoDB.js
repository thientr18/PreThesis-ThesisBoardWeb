const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI;

const connectMongo = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

module.exports = connectMongo;
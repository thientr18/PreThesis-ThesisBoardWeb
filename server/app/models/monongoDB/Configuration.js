const mongoose = require('mongoose');

const ConfigurationSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String },
  value: { type: String },
  scope: {
    type: String,
    enum: ['global', 'semester'],
    default: 'global'
  },
  semesterId: ({ type: Number, required: false }), // Only used if scope is 'semester'
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Configuration', ConfigurationSchema);
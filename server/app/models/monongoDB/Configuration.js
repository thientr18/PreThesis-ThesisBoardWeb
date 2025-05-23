import mongoose from 'mongoose';

const ConfigurationSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String },
  scope: {
    type: String,
    enum: ['global', 'semester'],
    default: 'global'
  },
  semesterId: ({ type: Number, required: false }), // Only used if scope is 'semester'
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Configuration', ConfigurationSchema);

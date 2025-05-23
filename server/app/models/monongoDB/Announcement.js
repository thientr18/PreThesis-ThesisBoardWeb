import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  targetAudience: {
    type: [String],
    enum: ['all', 'student', 'teacher', 'staff'],
    default: ['all']
  },
  attachments: [{ type: String }], // URLs or file references
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Number, required: true }, // ID (in MySQL) of the user who created the announcement
  expiresAt: { type: Date }
});

export default mongoose.model('Announcement', AnnouncementSchema);

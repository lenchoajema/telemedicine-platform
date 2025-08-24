import mongoose from 'mongoose';

const ForumReportSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending','Reviewed','ActionTaken'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ForumReport || mongoose.model('ForumReport', ForumReportSchema);

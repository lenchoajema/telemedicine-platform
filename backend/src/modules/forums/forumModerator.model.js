import mongoose from 'mongoose';

const ForumModeratorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumCategory', required: true },
  assignedAt: { type: Date, default: Date.now }
});

ForumModeratorSchema.index({ userId: 1, categoryId: 1 }, { unique: true });
export default mongoose.models.ForumModerator || mongoose.model('ForumModerator', ForumModeratorSchema);

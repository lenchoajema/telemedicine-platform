import mongoose from 'mongoose';

const ForumLikeSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

ForumLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });
export default mongoose.models.ForumLike || mongoose.model('ForumLike', ForumLikeSchema);

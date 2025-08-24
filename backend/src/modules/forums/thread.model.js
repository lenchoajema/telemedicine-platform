import mongoose from 'mongoose';

const ForumThreadSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumCategory', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  locked: { type: Boolean, default: false },
  views: { type: Number, default: 0 }
});

ForumThreadSchema.index({ categoryId: 1, createdAt: -1 });
export default mongoose.models.ForumThread || mongoose.model('ForumThread', ForumThreadSchema);

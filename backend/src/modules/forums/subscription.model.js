import mongoose from 'mongoose';

const ThreadSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumThread', required: true },
  subscribedAt: { type: Date, default: Date.now }
});

ThreadSubscriptionSchema.index({ userId: 1, threadId: 1 }, { unique: true });
export default mongoose.models.ThreadSubscription || mongoose.model('ThreadSubscription', ThreadSubscriptionSchema);

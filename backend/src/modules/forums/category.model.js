import mongoose from 'mongoose';

const ForumCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ForumCategory || mongoose.model('ForumCategory', ForumCategorySchema);

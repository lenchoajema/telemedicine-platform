import mongoose from 'mongoose';

const familyMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'adult', 'dependent'], required: true },
  status: { type: String, enum: ['active', 'invited', 'removed'], default: 'active' },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const familyGroupSchema = new mongoose.Schema({
  name: { type: String, default: 'My Household' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [familyMemberSchema], default: [] },
}, { timestamps: true });

familyGroupSchema.index({ ownerId: 1 });

const FamilyGroup = mongoose.model('FamilyGroup', familyGroupSchema);
export default FamilyGroup;

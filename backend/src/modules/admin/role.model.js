import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  description: { type: String },
  privileges: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);
export default Role;

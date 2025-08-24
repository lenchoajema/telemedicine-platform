import mongoose from 'mongoose';

const bankBranchSchema = new mongoose.Schema(
  {
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', required: true },
    city: { type: String },
    address: { type: String },
    branchCode: { type: String },
    swiftBIC: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

bankBranchSchema.index({ bankId: 1, branchCode: 1 }, { unique: false });

const BankBranch = mongoose.model('BankBranch', bankBranchSchema);
export default BankBranch;

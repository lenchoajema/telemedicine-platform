import mongoose from 'mongoose';

const FormularyDrugSchema = new mongoose.Schema({
  rxcui: { type: String },
  sku: { type: String },
  genericName: { type: String, required: true },
  brandName: { type: String },
  strength: { type: String },
  route: { type: String },
  form: { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });

FormularyDrugSchema.index({ genericName: 'text', brandName: 'text' });

export default mongoose.model('FormularyDrug', FormularyDrugSchema);

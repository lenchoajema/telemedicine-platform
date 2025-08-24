import mongoose from 'mongoose';

const serviceCatalogSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  defaultPrice: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const ServiceCatalog = mongoose.model('ServiceCatalog', serviceCatalogSchema);
export default ServiceCatalog;

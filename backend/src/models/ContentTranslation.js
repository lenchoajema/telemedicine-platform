import mongoose from 'mongoose';

const contentTranslationSchema = new mongoose.Schema(
  {
    namespace: { type: String, required: true, index: true },
    key: { type: String, required: true, index: true },
    language: { type: String, required: true, index: true }, // IETF BCP 47
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // string or ICU JSON
    updatedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

contentTranslationSchema.index({ namespace: 1, key: 1, language: 1 }, { unique: true });

const ContentTranslation = mongoose.model('ContentTranslation', contentTranslationSchema);

export default ContentTranslation;

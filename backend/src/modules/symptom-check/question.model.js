import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  symptomCode: { type: String },
  conditions: { type: [String] }
});

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);

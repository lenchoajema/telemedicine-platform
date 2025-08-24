import mongoose from 'mongoose';

const SymptomAnswerSchema = new mongoose.Schema({
  checkId: { type: mongoose.Schema.Types.ObjectId, ref: 'SymptomCheck', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  answerValue: { type: String, required: true }
});

export default mongoose.models.SymptomAnswer || mongoose.model('SymptomAnswer', SymptomAnswerSchema);

import Question from './question.model.js';
import SymptomCheck from './symptomCheck.model.js';
import SymptomAnswer from './symptomAnswer.model.js';
import { sendToQueue } from '../../services/queueService.js';

// GET /api/symptom-check/questions
export const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.json({ success: true, data: questions });
  } catch (err) {
    console.log('Error fetching questions:', err);
    res.status(500).json({ success: false, message: 'Failed to load questions' });
  }
};

// POST /api/symptom-check
export const createSymptomCheck = async (req, res) => {
  try {
    const userId = req.user._id;
    const { symptoms } = req.body;
    // Create initial symptom check record with pending state
    const check = await SymptomCheck.create({ userId, triageLevel: 'pending', recommendation: '', confidenceScore: 0, modelVersion: '' });
    // Save provided answers
    const answers = symptoms.map(s => ({ checkId: check._id, questionId: s.questionId, answerValue: s.answer }));
    await SymptomAnswer.insertMany(answers);
    // Enqueue for AI inference
    await sendToQueue('symptom_check', { checkId: check._id.toString(), userId: userId.toString(), symptoms });
    res.status(202).json({ success: true, data: { checkId: check._id, status: 'pending' } });
  } catch (err) {
    console.log('Error creating symptom check:', err);
    res.status(500).json({ success: false, message: 'Failed to create symptom check' });
  }
};

// GET /api/symptom-check/:checkId
export const getSymptomCheck = async (req, res) => {
  try {
    const { checkId } = req.params;
    const check = await SymptomCheck.findById(checkId);
    if (!check) return res.status(404).json({ success: false, message: 'Symptom check not found' });
    const answers = await SymptomAnswer.find({ checkId });
    res.json({ success: true, data: { check, answers } });
  } catch (err) {
    console.log('Error fetching symptom check:', err);
    res.status(500).json({ success: false, message: 'Failed to load symptom check' });
  }
};

// GET /api/symptom-check/history
export const getSymptomHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await SymptomCheck.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    console.log('Error fetching symptom history:', err);
    res.status(500).json({ success: false, message: 'Failed to load history' });
  }
};

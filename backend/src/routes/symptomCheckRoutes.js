import express from 'express';
import {
  getQuestions,
  createSymptomCheck,
  getSymptomCheck,
  getSymptomHistory
} from '../modules/symptom-check/symptomCheck.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: fetch available symptom questions
router.get('/questions', authenticate, getQuestions);

// Create a new symptom check and enqueue inference
router.post('/', authenticate, createSymptomCheck);

// Get a single symptom check result
router.get('/:checkId', authenticate, getSymptomCheck);

// Get history of symptom checks for current user
router.get('/history', authenticate, getSymptomHistory);

export default router;

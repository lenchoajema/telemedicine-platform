import { consumeQueue } from '../../services/queueService.js';
import SymptomCheck from './symptomCheck.model.js';
import { callAIService } from '../../services/aiService.js';
import AuditService from '../../services/AuditService.js';
import NotificationService from '../../services/NotificationService.js';
import { getIO } from '../../services/socket.service.js';

// Worker to process symptom_check jobs
(async () => {
  try {
    await consumeQueue('symptom_check', async ({ checkId, userId, symptoms }) => {
      console.log(`Processing symptom check job: ${checkId}`);
      // Call AI service for inference
      const result = await callAIService(symptoms);
      // Update SymptomCheck record
      await SymptomCheck.findByIdAndUpdate(checkId, {
        triageLevel: result.triageLevel,
        recommendation: result.recommendation,
        confidenceScore: result.confidenceScore,
        modelVersion: result.modelVersion
      });
      // Audit log the inference result
      await AuditService.log(userId, null, 'symptom_check', 'SymptomCheck', checkId, { result }, null, null);
      // Notify user of completion
      await NotificationService.dispatchEvent('symptom_check_complete', `Your symptom check ${checkId} is complete.`, userId);
      // Emit real-time update via WebSocket
      try {
        const io = getIO();
        io.to(`user_${userId}`).emit('symptom-check-complete', { checkId, result });
      } catch (e) {
        console.log('WebSocket emit error:', e);
      }
    });
    console.log('Symptom check worker listening for jobs...');
  } catch (err) {
    console.log('Symptom check worker error:', err);
  }
})();

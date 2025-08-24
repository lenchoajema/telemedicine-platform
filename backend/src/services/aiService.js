// AI service integration
import axios from 'axios';

export async function callAIService(symptoms) {
  // Real AI integration: forward to external inference endpoint if configured
  if (process.env.AI_SERVICE_URL) {
    try {
      const response = await axios.post(process.env.AI_SERVICE_URL, { symptoms });
      return response.data;
    } catch (err) {
      console.log('AI service call error:', err);
      // fallback to dummy inference below
    }
  }
  // Triage based on number of symptoms
  const count = symptoms.length;
  let triageLevel = 'self-care';
  if (count > 5) triageLevel = 'telemedicine';
  if (count > 10) triageLevel = 'emergency';

  const recommendation = `Based on symptoms, recommended: ${triageLevel}`;
  const confidenceScore = Math.random();
  const modelVersion = 'v1.0.0';

  return { triageLevel, recommendation, confidenceScore, modelVersion };
}

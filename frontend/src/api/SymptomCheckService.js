import apiClient from './apiClient';

const SymptomCheckService = {
  getQuestions() {
    return apiClient.get('/symptom-check/questions').then(res => res.data.data);
  },
  createCheck(payload) {
    return apiClient.post('/symptom-check', payload).then(res => res.data.data);
  },
  getCheck(checkId) {
    return apiClient.get(`/symptom-check/${checkId}`).then(res => res.data.data);
  },
  getHistory() {
    return apiClient.get('/symptom-check/history').then(res => res.data.data);
  }
};

export default SymptomCheckService;

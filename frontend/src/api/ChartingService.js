import apiClient from './apiClient';

const ChartingService = {
  getChart(appointmentId) {
    return apiClient.get(`/appointments/${appointmentId}/chart`).then(r => r.data.data);
  },
  upsertNote(appointmentId, payload) {
    return apiClient.post(`/appointments/${appointmentId}/chart/notes`, payload).then(r => r.data.data || r.data);
  },
  updateNote(appointmentId, noteId, updates) {
    return apiClient.patch(`/appointments/${appointmentId}/chart/notes/${noteId}`, updates).then(r => r.data.data || r.data);
  },
  signNote(appointmentId, noteId) {
    return apiClient.post(`/appointments/${appointmentId}/chart/notes/${noteId}/sign`).then(r => r.data.data || r.data);
  },
  listTemplates(appointmentId) {
    return apiClient.get(`/appointments/${appointmentId}/chart/note-templates`).then(r => r.data.data || r.data);
  },
  upsertTemplate(appointmentId, payload) {
    return apiClient.post(`/appointments/${appointmentId}/chart/note-templates`, payload).then(r => r.data.data || r.data);
  }
};

export default ChartingService;

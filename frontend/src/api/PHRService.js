import apiClient from './apiClient';

const PHRService = {
  getOverview() { return apiClient.get('/phr/overview').then(r=>r.data.data); },
  createShareLink(payload) { return apiClient.post('/phr/share-links', payload).then(r=>r.data.data); },
  listShareLinks() { return apiClient.get('/phr/share-links').then(r=>r.data.data); },
  revokeShareLink(id) { return apiClient.patch(`/phr/share-links/${id}/revoke`).then(r=>r.data.data); },
  externalShare(token) { return apiClient.get(`/phr/share/${token}`).then(r=>r.data.data); },
  consultations(params={}) { return apiClient.get('/phr/consultations',{ params }).then(r=>r.data.data); },
  prescriptions(params={}) { return apiClient.get('/phr/prescriptions',{ params }).then(r=>r.data.data); },
  documents(params={}) { return apiClient.get('/phr/documents',{ params }).then(r=>r.data.data); },
  labs(params={}) { return apiClient.get('/phr/labs',{ params }).then(r=>r.data.data); },
  imaging(params={}) { return apiClient.get('/phr/imaging',{ params }).then(r=>r.data.data); },
  getPreferences() { return apiClient.get('/phr/settings').then(r=>r.data.data); },
  updatePreferences(payload) { return apiClient.put('/phr/settings', payload).then(r=>r.data.data); },
  audit(params={}) { return apiClient.get('/phr/audit',{ params }).then(r=>r.data.data); },
  createExportJob(format) { return apiClient.post('/phr/export/jobs',{ format }).then(r=>r.data.data); },
  getExportJob(jobId) { return apiClient.get(`/phr/export/jobs/${jobId}`).then(r=>r.data.data); }
};

export default PHRService;

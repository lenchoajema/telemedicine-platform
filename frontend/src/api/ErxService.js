import apiClient from './apiClient';

const ErxService = {
  searchPharmacies(query) {
    return apiClient.get('/pharmacies', { params: { query } }).then(r => r.data.data || r.data);
  },
  listPrescriptions(params={}) {
    return apiClient.get('/prescriptions', { params }).then(r => r.data.data || r.data);
  },
  createPrescription(payload) {
    return apiClient.post('/prescriptions', payload).then(r => r.data.data || r.data);
  },
  sendPrescription(id) {
    return apiClient.post(`/prescriptions/${id}/send`).then(r => r.data.data || r.data);
  },
  cancelPrescription(id, reason) {
    return apiClient.patch(`/prescriptions/${id}/cancel`, { reason }).then(r => r.data.data || r.data);
  },
  routeToPharmacy(id, payload) {
    // payload: { pharmacyId, lifecycleId? }
    return apiClient.post(`/prescriptions/${id}/route-to-pharmacy`, payload).then(r => r.data.data || r.data);
  }
};

export default ErxService;

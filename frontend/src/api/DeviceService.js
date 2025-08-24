import apiClient from './apiClient';

const DeviceService = {
  connectDevice(provider) {
    return apiClient.post('/devices/connect', { provider, scopes: ['vitals', 'activity'] }).then(r => r.data);
  },
  getStatus() {
    return apiClient.get('/devices/status').then(r => r.data.data);
  },
  syncData(integrationId) {
    return apiClient.post('/devices/sync', { integrationId }).then(r => r.data);
  },
  getVitals(params = {}) {
    return apiClient.get('/devices/vitals', { params }).then(r => {
      const data = r.data?.data;
      // Support both {items, pagination} and legacy array
      if (data && Array.isArray(data.items)) return data.items;
      if (Array.isArray(data)) return data;
      return [];
    });
  },
  disconnectDevice(integrationId) {
    // Prefer RESTful route; keep legacy /disconnect fallback for compatibility
    return apiClient.delete(`/devices/${integrationId}`)
      .then(r => r.data)
      .catch(() => apiClient.delete(`/devices/disconnect`, { params: { integrationId }, data: { integrationId } }).then(r => r.data));
  },
};

export default DeviceService;

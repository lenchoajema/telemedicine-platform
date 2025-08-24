import apiClient from './apiClient';

const OrdersService = {
  createLabOrders(payload) {
    return apiClient.post('/orders/labs', payload).then(r => r.data.data || r.data);
  },
  createImagingOrder(payload) {
    return apiClient.post('/orders/imaging', payload).then(r => r.data.data || r.data);
  },
  listLabOrders(params) {
    return apiClient.get('/orders/labs', { params }).then(r => r.data.data || r.data);
  },
  listImagingOrders(params) {
    return apiClient.get('/orders/imaging', { params }).then(r => r.data.data || r.data);
  }
};

export default OrdersService;

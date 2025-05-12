import apiClient from './apiClient';

class DoctorService {
  static async getAllDoctors() {
    const response = await apiClient.get('/doctors');
    return response;
  }

  static async getDoctorById(id) {
    const response = await apiClient.get(`/doctors/${id}`);
    return response;
  }
}

export default DoctorService;
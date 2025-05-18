import apiClient from './apiClient';

class DoctorService {
  static async getAllDoctors(searchParams = {}) {
    try {
      const response = await apiClient.get('/doctors', { params: searchParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }

  static async getDoctorById(id) {
    try {
      const response = await apiClient.get(`/doctors/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching doctor ${id}:`, error);
      throw error;
    }
  }

  static async getDoctorProfile() {
    try {
      const response = await apiClient.get('/doctors/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      throw error;
    }
  }

  static async getDoctorStats() {
    try {
      const response = await apiClient.get('/doctors/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor stats:', error);
      throw error;
    }
  }

  static async getAvailability() {
    try {
      const response = await apiClient.get('/doctors/availability');
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
      throw error;
    }
  }

  static async setAvailability(availabilityData) {
    try {
      const response = await apiClient.post('/doctors/availability', availabilityData);
      return response.data;
    } catch (error) {
      console.error('Error setting doctor availability:', error);
      throw error;
    }
  }

  static async updateVerification(verificationData) {
    try {
      const response = await apiClient.post('/doctors/verification', verificationData);
      return response.data;
    } catch (error) {
      console.error('Error updating doctor verification:', error);
      throw error;
    }
  }

  static async getMyPatients() {
    try {
      const response = await apiClient.get('/doctors/my-patients');
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      throw error;
    }
  }

  static async getSpecializations() {
    try {
      const response = await apiClient.get('/doctors/specializations');
      return response.data;
    } catch (error) {
      console.error('Error fetching specializations:', error);
      throw error;
    }
  }
}

export default DoctorService;
import apiClient from './apiClient';

class DoctorService {
  static async getAllDoctors(searchParams = {}) {
    try {
      const response = await apiClient.get('/doctors', { params: searchParams });
      return response.data;
    } catch (error) {
      console.log('Error fetching doctors:', error);
      throw error;
    }
  }

  static async getDoctorById(id) {
    try {
      const response = await apiClient.get(`/doctors/${id}`);
      return response.data;
    } catch (error) {
      console.log(`Error fetching doctor ${id}:`, error);
      throw error;
    }
  }

  static async getDoctorProfile() {
    try {
      const response = await apiClient.get('/doctors/profile');
      return response.data;
    } catch (error) {
      console.log('Error fetching doctor profile:', error);
      throw error;
    }
  }

  static async getDoctorStats() {
    try {
      const response = await apiClient.get('/doctors/stats');
      return response.data;
    } catch (error) {
      console.log('Error fetching doctor stats:', error);
      throw error;
    }
  }

  static async getAvailability() {
    try {
      const response = await apiClient.get('/doctors/availability');
      // Backend now returns { success:true, blocks:[...] }
      const data = response.data;
      if (data && Array.isArray(data.blocks)) {
        return data.blocks;
      }
      // Fallback to legacy shape (array)
      if (Array.isArray(data)) return data;
      if (data && data.data && Array.isArray(data.data.blocks)) return data.data.blocks;
      return [];
    } catch (error) {
      console.log('Error fetching doctor availability:', error);
      throw error;
    }
  }

  static async setAvailability(availabilityData) {
    try {
      const response = await apiClient.post('/doctors/availability', availabilityData);
      return response.data;
    } catch (error) {
      console.log('Error setting doctor availability:', error);
      throw error;
    }
  }

  static async setAvailabilityBlocks(blocks) {
    try {
      const response = await apiClient.post('/doctors/availability', { blocks });
      return response.data;
    } catch (error) {
      console.log('Error setting doctor availability blocks:', error);
      throw error;
    }
  }

  static async updateVerification(verificationData) {
    try {
      const response = await apiClient.post('/doctors/verification', verificationData);
      return response.data;
    } catch (error) {
      console.log('Error updating doctor verification:', error);
      throw error;
    }
  }

  static async getMyPatients() {
    try {
      const response = await apiClient.get('/doctors/my-patients');
      return response.data;
    } catch (error) {
      console.log('Error fetching doctor patients:', error);
      throw error;
    }
  }

  static async getSpecializations() {
    try {
      const response = await apiClient.get('/doctors/specializations');
      return response.data;
    } catch (error) {
      console.log('Error fetching specializations:', error);
      throw error;
    }
  }

  // Verification documents
  static async listVerificationDocuments() {
    const { data } = await apiClient.get('/doctors/verification-documents');
    return data;
  }

  static async uploadVerificationDocuments(filesWithTypes) {
    // filesWithTypes: Array<{ file: File, type: string }>
    const form = new FormData();
    filesWithTypes.forEach(item => {
      form.append('files', item.file);
      form.append('type', item.type);
    });
    const { data } = await apiClient.post('/doctors/verification-documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }

  static async addVerificationDocument(type, fileUrl) {
    const { data } = await apiClient.post('/doctors/verification-documents', { type, fileUrl });
    return data;
  }

  static async removeVerificationDocument(type) {
    const { data } = await apiClient.delete(`/doctors/verification-documents/${encodeURIComponent(type)}`);
    return data;
  }
}

export default DoctorService;
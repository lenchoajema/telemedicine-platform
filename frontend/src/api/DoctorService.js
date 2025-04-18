import axios from 'axios';

const API_URL = '/api/doctors';

class DoctorService {
  static async getAllDoctors() {
    const response = await axios.get(API_URL);
    return response;
  }

  static async getDoctorById(id) {
    const response = await axios.get(`${API_URL}/${id}`);
    return response;
  }
}

export default DoctorService;
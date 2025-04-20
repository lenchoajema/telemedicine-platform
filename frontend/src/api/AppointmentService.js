import axios from 'axios';

const API_URL = '/api/appointments';

class AppointmentService {
  static async getUpcomingAppointments() {
    const response = await axios.get(`${API_URL}/upcoming`);
    return response;
  }

  static async getStats() {
    const response = await axios.get(`${API_URL}/stats`);
    return response;
  }
}

export default AppointmentService;

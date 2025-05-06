import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL + "/appointments";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json"
    }
  };
};

class AppointmentService {
  static async getUpcomingAppointments() {
    try {
      const response = await axios.get(`${API_URL}/upcoming`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
      return [];
    }
  }

  static async getStats() {
    try {
      const response = await axios.get(`${API_URL}/stats`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error("Error fetching appointment stats:", error);
      return {};
    }
  }

  static async getAvailableSlots(date) {
    try {
      const response = await axios.get(
        `${API_URL}/available-slots`, 
        {
          ...getAuthHeaders(),
          params: { date: date.toISOString().split("T")[0] }
        }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching available slots:", error);
      return [];
    }
  }

  static async getAppointmentsByDate(date) {
    try {
      const response = await axios.get(
        `${API_URL}/by-date`, 
        {
          ...getAuthHeaders(),
          params: { date: date.toISOString().split("T")[0] }
        }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching appointments by date:", error);
      return [];
    }
  }

  static async createAppointment(appointmentData) {
    try {
      const response = await axios.post(
        API_URL, 
        appointmentData, 
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
  }

  static async cancelAppointment(appointmentId) {
    try {
      const response = await axios.put(
        `${API_URL}/${appointmentId}/cancel`, 
        {}, 
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      throw error;
    }
  }
}

export default AppointmentService;
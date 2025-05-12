// filepath: /workspaces/telemedicine-platform/frontend/src/api/AppointmentService.js
import apiClient from './apiClient';

class AppointmentService {
  static async getUpcomingAppointments() {
    try {
      const response = await apiClient.get('/appointments/upcoming');
      return response.data;
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
      return [];
    }
  }

  static async getStats() {
    try {
      const response = await apiClient.get('/appointments/stats');
      return response.data;
    } catch (error) {
      console.error("Error fetching appointment stats:", error);
      return { upcomingCount: 0, completedCount: 0, todayCount: 0 };
    }
  }

  static async getAvailableSlots(date, doctorId = null) {
    try {
      const params = { 
        date: date.toISOString().split("T")[0]
      };
      
      // Add doctorId to params if provided
      if (doctorId) {
        params.doctorId = doctorId;
      }
      
      const response = await apiClient.get('/appointments/available-slots', { params });

      // Ensure response.data is always an array
      const slots = Array.isArray(response.data) ? response.data : [];
      
      // Convert string dates to Date objects for easier processing
      return slots.map(slot => new Date(slot));
    } catch (error) {
      console.error("Error fetching available slots:", error);
      return [];
    }
  }

  static async getAppointmentsByDate(date) {
    try {
      const response = await apiClient.get('/appointments/by-date', {
        params: { date: date.toISOString().split("T")[0] }
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching appointments by date:", error);
      return [];
    }
  }

  static async createAppointment(appointmentData) {
    try {
      const response = await apiClient.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
  }

  static async cancelAppointment(appointmentId) {
    try {
      const response = await apiClient.put(`/appointments/${appointmentId}/cancel`, {});
      return response.data;
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      throw error;
    }
  }
  
  static async rescheduleAppointment(appointmentId, newDate) {
    try {
      const response = await apiClient.put(
        `/appointments/${appointmentId}/reschedule`,
        { date: newDate.toISOString() }
      );
      return response.data;
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      throw error;
    }
  }
}

export default AppointmentService;

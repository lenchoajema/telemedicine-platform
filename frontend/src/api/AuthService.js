import axios from 'axios';

const API_URL = '/api/auth';

class AuthService {
  static async register(userData) {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  }

  static async login(credentials) {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
  }

  static async getMe() {
    const response = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data.user;
  }
}

export default AuthService;
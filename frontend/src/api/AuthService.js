import apiClient from './apiClient';

class AuthService {
  static async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  }

  static async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  }

  static async getMe() {
    return apiClient.get('/auth/me').then(response => response.data.user);
  }
}

export default AuthService;

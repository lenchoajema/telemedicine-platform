import { apiClient } from './ApiClient';

export class AuthService {
  static async login(email: string, password: string) {
    return await apiClient.post('/auth/login', {
      email,
      password,
    });
  }

  static async register(userData: {
    email: string;
    password: string;
    role: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  }) {
    return await apiClient.post('/auth/register', userData);
  }

  static async getCurrentUser(token?: string) {
    return await apiClient.get('/auth/me');
  }

  static async logout() {
    // If you have a logout endpoint on your backend
    return await apiClient.post('/auth/logout');
  }

  static async forgotPassword(email: string) {
    return await apiClient.post('/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, newPassword: string) {
    return await apiClient.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
  }
}

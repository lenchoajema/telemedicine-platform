import { apiClient } from './ApiClient';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class AuthService {
  static async login(email: string, password: string): Promise<ApiResponse> {
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
      phone?: string;
      dateOfBirth?: string;
    };
  }): Promise<ApiResponse> {
    return await apiClient.post('/auth/register', userData);
  }

  static async getCurrentUser(token?: string): Promise<ApiResponse> {
    return await apiClient.get('/auth/me');
  }

  static async logout(): Promise<ApiResponse> {
    // If you have a logout endpoint on your backend
    return await apiClient.post('/auth/logout');
  }

  static async forgotPassword(email: string): Promise<ApiResponse> {
    return await apiClient.post('/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return await apiClient.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
  }
}

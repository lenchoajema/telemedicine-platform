import { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../api/AuthService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const credentials = { email, password };
      console.log('Attempting login with:', { email });
      const response = await AuthService.login(credentials);
      console.log('Login successful:', response);
      
      // Handle the standardized backend response format: {success: true, data: {user, token}}
      const user = response.success ? response.data.user : response.user;
      const token = response.success ? response.data.token : response.token;
      
      if (!user || !token) {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response from server');
      }
      
      console.log('Extracted user:', user);
      console.log('Extracted token:', token ? 'Present' : 'Missing');
      
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Provide a more specific error message based on the response
      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password.');
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Login failed. Please check your connection.');
      }
    }
  };

  const register = async (userData) => {
    try {
      const data = await AuthService.register(userData);
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
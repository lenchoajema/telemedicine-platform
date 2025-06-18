import { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../api/AuthService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const credentials = { email, password };
      console.log('Attempting login with:', { email });
      const data = await AuthService.login(credentials);
      console.log('Login successful:', data);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      return data.user;
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
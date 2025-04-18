import { createContext, useState, useEffect } from 'react';
import AuthService from '../api/AuthService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await AuthService.getMe();
        setUser(userData);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const { user, token } = await AuthService.login(credentials);
    localStorage.setItem('token', token);
    setUser(user);
  };

  const register = async (userData) => {
    const { user, token } = await AuthService.register(userData);
    localStorage.setItem('token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
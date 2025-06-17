<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { AuthContext, useAuth } from './AuthContextDefinition.js';
import AuthService from '../api/AuthService';

// Don't re-export hooks from component files for Fast Refresh compatibility
// Import useAuth directly from './authContext' where needed instead
export { useAuth };
=======
import { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../api/AuthService';

export const AuthContext = createContext(null);
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
<<<<<<< HEAD
    // Check if user is stored in local storage
=======
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
<<<<<<< HEAD
      // Use the AuthService for login
=======
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
      const data = await AuthService.login(credentials);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
<<<<<<< HEAD
      // Use AuthService for registration
=======
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
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
<<<<<<< HEAD
=======
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
};
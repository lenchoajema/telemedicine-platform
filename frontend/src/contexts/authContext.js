import { createContext, useContext } from 'react';

// Create the authentication context
export const AuthContext = createContext(null);

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
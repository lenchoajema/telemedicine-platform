import { createContext, useContext } from 'react';

// Create the auth context
export const AuthContext = createContext(null);

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

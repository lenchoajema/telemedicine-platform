import { createContext, useContext } from 'react';

// Create the authentication context
export const AuthContext = createContext(null);

// AuthProvider component to wrap your app and provide auth context
export const AuthProvider = ({ children, value }) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) 
    console.warn('useAuth must be used within an AuthProvider');
    return {};
  return context;
};
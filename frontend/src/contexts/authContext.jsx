import React, { createContext, useState, useContext, useEffect } from "react";
import apiClient from "../api/apiClient";
import jwtDecode from "jwt-decode";

// Create the auth context
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Fetch current user profile from backend
          const response = await apiClient.get("/auth/me");
          // Response shape: { success: boolean, data: { user } }8
          if (response.data?.success && response.data.data?.user) {
            setUser(response.data.data.user);
          } else {
            console.warn(
              "AuthContext: unexpected /auth/me response",
              response.data
            );
            logout();
          }
        } catch (error) {
          console.error("Failed to load user:", error);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      // Response data shape: { success, data: { user, token } }
      const { user: loggedUser, token: newToken } = response.data.data;
      // Store and set token; interceptor handles Authorization header
      localStorage.setItem("token", newToken);
      setToken(newToken);
      // Set user information
      setUser(loggedUser);
      return loggedUser;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Register a new user and auto-login
  const register = async (registrationData) => {
    try {
      const response = await apiClient.post("/auth/register", registrationData);
      const { user: newUser, token: newToken } = response.data.data;
      // Store and set token
      localStorage.setItem("token", newToken);
      setToken(newToken);
      // Set user info
      setUser(newUser);
      return newUser;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  const value = {
    user,
    token,
    login,
    register, // expose enhanced register
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import apiClient from "../services/apiClient";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get("/auth/me");
      const u = res.data?.data?.user || res.data?.data || res.data?.user;
      setUser(u);
    } catch {
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const res = await apiClient.post("/auth/login", { email, password });
    if (res.data?.success && res.data.data?.token) {
      const { token: tkn, user: u } = res.data.data;
      localStorage.setItem("token", tkn);
      setToken(tkn);
      setUser(u);
      return u;
    }
    throw new Error(res.data?.message || "Login failed");
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {}
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;

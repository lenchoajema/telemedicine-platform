import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../services/apiClient";
import { useAuth } from "./AuthContext";

const RemindersContext = createContext(null);

export const useReminders = () => {
  const context = useContext(RemindersContext);
  if (!context) {
    throw new Error("useReminders must be used within a RemindersProvider");
  }
  return context;
};

export const RemindersProvider = ({ children }) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReminders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/reminders/${user._id}`);
      console.log(
        "fetchReminders API response for user",
        user._id,
        res.data.data
      );
      if (res.data?.data) {
        setReminders(res.data.data);
        console.log("Reminders set in context:", res.data.data.length);
      }
    } catch (err) {
      console.log("Error fetching reminders", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/reminders/${notificationId}/read`);
      setReminders((prev) =>
        prev.map((r) => (r._id === notificationId ? { ...r, read: true } : r))
      );
    } catch (err) {
      console.log("Error marking reminder read", err);
    }
  };

  useEffect(() => {
    fetchReminders();
    // Optionally refresh periodically
    const interval = setInterval(fetchReminders, 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <RemindersContext.Provider
      value={{ reminders, loading, fetchReminders, markAsRead }}
    >
      {children}
    </RemindersContext.Provider>
  );
};

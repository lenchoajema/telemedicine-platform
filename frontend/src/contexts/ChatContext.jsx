import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import apiClient from "../services/apiClient";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = useMemo(
    () => io(import.meta.env.VITE_WS_URL || "http://localhost:5000"),
    []
  );
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState({
    providers: [],
    support: null,
    others: [],
  });

  const fetchContacts = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get("/chats/contacts");
      setContacts(
        res.data.data || { providers: [], support: null, others: [] }
      );
    } catch (err) {
      console.log("Error fetching contacts:", err);
    }
  };

  const dedupeSessions = (list) => {
    const seen = new Set();
    const result = [];
    for (const s of list) {
      if (!s || !s._id) continue;
      if (seen.has(s._id)) continue;
      seen.add(s._id);
      result.push(s);
    }
    return result;
  };

  const upsertSession = (session) => {
    if (!session || !session._id) return;
    setSessions((prev) => {
      let replaced = false;
      const mapped = prev.map((s) => {
        if (s._id === session._id) {
          replaced = true;
          return { ...s, ...session }; // merge updates
        }
        return s;
      });
      if (!replaced) {
        return [session, ...mapped];
      }
      // Move updated session to front for recency
      return [session, ...mapped.filter((s) => s._id !== session._id)];
    });
  };

  const fetchSessions = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get("/chats/sessions");
      const data = res.data.data || [];
      setSessions(dedupeSessions(data));
    } catch (err) {
      console.log("Error fetching chat sessions:", err);
    }
  };

  const fetchMessages = async (sessionId) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/chats/sessions/${sessionId}/messages`);
      setMessages(res.data.data || []);
    } catch (err) {
      console.log("Error fetching chat messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contacts when user changes
  useEffect(() => {
    fetchContacts();
  }, [user]);

  // Fetch sessions when user changes
  useEffect(() => {
    fetchSessions();
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Listen for real-time messages once
  useEffect(() => {
    socket.on("new_message", (msg) => {
      if (msg.sessionId === selectedSession?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => {
      socket.off("new_message");
    };
  }, [socket, selectedSession]);

  const selectSession = (session) => {
    setSelectedSession(session);
    fetchMessages(session._id);
    // join Socket.IO room for this session
    socket.emit("joinSession", session._id);
  };

  const sendMessage = async (content) => {
    if (!selectedSession) return;
    try {
      // emit via WebSocket
      socket.emit("send_message", {
        sessionId: selectedSession._id,
        content,
      });
      // persist via HTTP (message will be received via socket)
      await apiClient.post(`/chats/sessions/${selectedSession._id}/messages`, {
        content,
      });
    } catch (err) {
      console.log("Error sending chat message:", err);
    }
  };

  const createSession = async (participants, appointmentId = null) => {
    try {
      const payload = { participants };
      if (appointmentId) payload.appointmentId = appointmentId;
      const res = await apiClient.post("/chats/sessions", payload);
      const session = res.data.data;
      upsertSession(session);
      return session;
    } catch (err) {
      console.log("Error creating chat session:", err);
    }
  };

  const getSupportSession = async () => {
    try {
      const res = await apiClient.get("/chats/support-session");
      const session = res.data.data;
      upsertSession(session);
      return session;
    } catch (err) {
      console.log("Error fetching support session:", err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        sessions,
        selectedSession,
        messages,
        loading,
        fetchSessions,
        createSession,
        getSupportSession,
        selectSession,
        sendMessage,
        contacts,
        fetchContacts,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

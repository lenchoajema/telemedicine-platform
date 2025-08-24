import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useAuth } from "../../contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./ChatPage.css";

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    sessions,
    contacts,
    selectedSession,
    messages,
    loading,
    fetchSessions,
    getSupportSession,
    selectSession,
    sendMessage,
    createSession,
  } = useChat();
  const [newMessage, setNewMessage] = useState("");

  const handleSessionClick = (session) => selectSession(session);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleContactClick = async (contact) => {
    try {
      // Create or fetch session with this contact
      const session = await createSession([user._id, contact._id]);
      if (session) {
        // Select session locally
        selectSession(session);
        // Navigate to chat page with sessionId query
        navigate(`/chat?sessionId=${session._id}`);
      }
    } catch (err) {
      console.log("Error initiating chat with contact:", err);
    }
  };
  // Admin contact for direct support
  const adminContact = (contacts?.others || []).find((c) => c.role === "admin");

  // On mount, fetch user sessions once
  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle support chat link
  useEffect(() => {
    if (searchParams.get("support") === "true") {
      getSupportSession().then((sess) => {
        if (sess) selectSession(sess);
      });
    }
  }, [searchParams, getSupportSession, selectSession]);

  // Auto-select sessionId from query param
  useEffect(() => {
    const sessionId = searchParams.get("sessionId");
    if (sessionId && sessions.length > 0 && !selectedSession) {
      const sess = sessions.find((s) => s._id === sessionId);
      if (sess) selectSession(sess);
    }
  }, [searchParams, sessions, selectedSession, selectSession]);

  // Session navigation index
  const sessionIndex = selectedSession
    ? sessions.findIndex((s) => s._id === selectedSession._id)
    : -1;

  const goPrevSession = () => {
    if (sessionIndex > 0) selectSession(sessions[sessionIndex - 1]);
  };
  const goNextSession = () => {
    if (sessionIndex < sessions.length - 1)
      selectSession(sessions[sessionIndex + 1]);
  };

  return (
    <div className="chat-page">
      <div className="chat-sessions">
        {/* Session navigation */}
        <div className="session-nav">
          <button onClick={goPrevSession} disabled={sessionIndex <= 0}>
            ‹ Prev
          </button>
          <button
            onClick={goNextSession}
            disabled={sessionIndex < 0 || sessionIndex >= sessions.length - 1}
          >
            Next ›
          </button>
        </div>
        {/* Direct Admin Chat */}
        {adminContact && (
          <div className="admin-chat-link">
            <button onClick={() => handleContactClick(adminContact)}>
              Chat with Administrator
            </button>
          </div>
        )}
        {/* Contacts list */}
        <div className="chat-contacts">
          <h4>Contacts</h4>
          <div className="contacts-section">
            <strong>Providers:</strong>
            {(contacts?.providers || []).map((c) => (
              <button
                key={c._id}
                type="button"
                className="contact-item"
                onClick={() => handleContactClick(c)}
              >
                {c.profile?.firstName || c.username || ""}{" "}
                {c.profile?.lastName || ""}
              </button>
            ))}
            {contacts?.support && (
              <>
                <strong>Support:</strong>
                <button
                  type="button"
                  className="contact-item"
                  onClick={() => handleContactClick(contacts.support)}
                >
                  {contacts.support.profile?.firstName ||
                    contacts.support.username ||
                    ""}{" "}
                  {contacts.support.profile?.lastName || ""}
                </button>
              </>
            )}
            {/* Administrators for system issues */}
            <strong>Administrators:</strong>
            {(contacts?.others || [])
              .filter((c) => c.role === "admin")
              .map((c) => (
                <button
                  key={c._id}
                  type="button"
                  className="contact-item"
                  onClick={() => handleContactClick(c)}
                >
                  {c.profile?.firstName || c.username || ""}{" "}
                  {c.profile?.lastName || ""}
                </button>
              ))}
            <strong>Others:</strong>
            {(contacts?.others || [])
              .filter((c) => c.role !== "admin")
              .map((c) => (
                <button
                  key={c._id}
                  type="button"
                  className="contact-item"
                  onClick={() => handleContactClick(c)}
                >
                  {c.profile?.firstName || c.username || ""}{" "}
                  {c.profile?.lastName || ""} ({c.role})
                </button>
              ))}
          </div>
        </div>
        <h3>Conversations</h3>
        {sessions.length === 0 && <p>No conversations yet.</p>}
        {(sessions || []).map((sess) => (
          <button
            key={sess._id}
            type="button"
            className={`chat-session-item ${
              selectedSession?._id === sess._id ? "active" : ""
            }`}
            onClick={() => handleSessionClick(sess)}
          >
            {(sess.participants || [])
              .filter((p) => p._id !== user._id)
              .map(
                (p) =>
                  `${p.profile?.firstName || p.username || ""} ${
                    p.profile?.lastName || ""
                  }`
              )
              .join(", ")}
          </button>
        ))}
      </div>
      <div className="chat-window">
        {selectedSession ? (
          <>
            <div className="chat-messages">
              {loading && <p>Loading messages...</p>}
              {!loading &&
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`chat-message-item ${
                      msg.sender._id === user._id ? "sent" : "received"
                    }`}
                  >
                    <span className="sender">
                      {msg.sender?.profile?.firstName ||
                        msg.sender?.username ||
                        ""}
                    </span>
                    <span className="content">{msg.content}</span>
                    <span className="timestamp">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={handleSend}>Send</button>
            </div>
          </>
        ) : (
          <div className="chat-placeholder">
            <p>Select a conversation to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}

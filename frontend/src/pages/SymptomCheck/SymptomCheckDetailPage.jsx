import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import SymptomCheckService from "../../api/SymptomCheckService";
import { useNotifications } from "../../contexts/NotificationContextCore";
import { io } from "socket.io-client";
import { useAuth } from "../../contexts/useAuth";

export default function SymptomCheckDetailPage() {
  const { checkId } = useParams();
  const { user } = useAuth();
  const [check, setCheck] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    let timer;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await SymptomCheckService.getCheck(checkId);
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL ||
            "https://telemedicine-platform-mt8a.onrender.com/api"
          }/symptom-checks/${checkId}`
        );
        setCheck(data.check);
        setAnswers(data.answers);
        // If still pending, schedule another fetch
        if (data.check.triageLevel === "pending") {
          timer = setTimeout(fetchData, 5000);
        }
      } catch (err) {
        console.error("Failed to load symptom check", err);
        addNotification("Failed to load symptom check results", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Setup WebSocket for real-time updates
    const socket = io(
      import.meta.env.VITE_WS_URL ||
        "https://telemedicine-platform-mt8a.onrender.com"
    );
    if (user && user._id) {
      socket.emit("joinUser", user._id);
      socket.on("symptom-check-complete", ({ checkId: cid }) => {
        if (cid === checkId) fetchData();
      });
    }
    return () => {
      clearTimeout(timer);
      socket.disconnect();
    };
  }, [checkId, user]);

  if (loading) return <div>Loading...</div>;
  if (!check) return <div>Check not found</div>;

  return (
    <div className="symptom-check-detail">
      <h1>Symptom Check Result</h1>
      <p>
        <strong>Triage Level:</strong> {check.triageLevel}
      </p>
      <p>
        <strong>Recommendation:</strong> {check.recommendation}
      </p>
      <p>
        <strong>Confidence Score:</strong>{" "}
        {(check.confidenceScore * 100).toFixed(1)}%
      </p>
      <h2>Answers</h2>
      <ul>
        {answers.map((a) => (
          <li key={a._id}>
            {a.questionId}: {a.answerValue}
          </li>
        ))}
      </ul>
    </div>
  );
}

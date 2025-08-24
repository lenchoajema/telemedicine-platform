import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SymptomCheckService from "../../api/SymptomCheckService";
import { useNotifications } from "../../contexts/NotificationContextCore";

export default function SymptomCheckPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  useEffect(() => {
    SymptomCheckService.getQuestions()
      .then((data) => {
        setQuestions(data);
      })
      .catch((err) => {
        console.error("Failed to load questions", err);
        addNotification("Failed to load symptom questions", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        symptoms: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      };
      const { checkId } = await SymptomCheckService.createCheck(payload);
      addNotification("Symptom check submitted", "success");
      navigate(`/symptom-check/${checkId}`);
    } catch (err) {
      console.error("Error creating symptom check", err);
      addNotification("Failed to start symptom check", "error");
    }
  };

  if (loading) return <div>Loading questions...</div>;

  return (
    <div className="symptom-check-page">
      <h1>Symptom Checker</h1>
      <form onSubmit={handleSubmit}>
        {questions.map((q) => (
          <div key={q._id}>
            <label>{q.text}</label>
            <input
              type="text"
              value={answers[q._id] || ""}
              onChange={(e) => handleChange(q._id, e.target.value)}
              required
            />
          </div>
        ))}
        <button type="submit">Start Check</button>
      </form>
    </div>
  );
}

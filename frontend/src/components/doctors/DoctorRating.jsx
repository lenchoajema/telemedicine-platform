import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './DoctorRating.css';

export default function DoctorRating({ doctorId, initialRating = 0, readOnly = false, onRatingSubmit }) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  
  const handleRatingClick = async (newRating) => {
    if (readOnly) return;
    
    setRating(newRating);
    
    if (newRating <= 3) {
      setShowFeedback(true);
    } else {
      await submitRating(newRating);
    }
  };
  
  const submitRating = async (ratingValue = rating, feedbackText = feedback) => {
    if (!user) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors/${doctorId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rating: ratingValue,
          feedback: feedbackText
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }
      
      const data = await response.json();
      
      if (onRatingSubmit) {
        onRatingSubmit(data);
      }
      
      setShowFeedback(false);
      
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    submitRating();
  };
  
  return (
    <div className="doctor-rating">
      {readOnly ? (
        <div className="rating-display">
          {[...Array(5)].map((_, index) => (
            <span
              key={index}
              className={`star ${index < Math.round(rating) ? 'filled' : ''}`}
            >
              ★
            </span>
          ))}
          <span className="rating-value">({rating.toFixed(1)})</span>
        </div>
      ) : (
        <div className="rating-interactive">
          {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            
            return (
              <span
                key={index}
                className={`star ${ratingValue <= (hover || rating) ? 'filled' : ''}`}
                onClick={() => handleRatingClick(ratingValue)}
                onMouseEnter={() => setHover(ratingValue)}
                onMouseLeave={() => setHover(0)}
              >
                ★
              </span>
            );
          })}
        </div>
      )}
      
      {showFeedback && (
        <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
          <textarea
            placeholder="Please tell us how we can improve..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            required
          />
          <div className="feedback-actions">
            <button 
              type="button" 
              onClick={() => setShowFeedback(false)}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-submit"
              disabled={submitting || !feedback.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

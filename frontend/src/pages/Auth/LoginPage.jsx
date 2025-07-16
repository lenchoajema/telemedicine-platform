import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import './auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('handleSubmit triggered');
  setLoading(true);
  try {
    const user = await login(email, password);
    console.log('Login completed, user received:', user);
    addNotification('Login successful!', 'success');
    
    // Add a small delay to ensure state is updated before navigation
    setTimeout(() => {
      console.log('Navigating to dashboard...');
      navigate('/dashboard');
    }, 100);
  } catch (error) {
    console.error('Login failed:', error);
    addNotification(error.message || 'Login failed', 'error');
  } finally {
    setLoading(false);
  }
};

return (
  <div className="auth-page">
    <div className="auth-container">
      <h1 className="auth-title">Welcome Back</h1>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="loginEmail">Email</label>
          <input
            id="loginEmail"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="auth-input"
          />
          </div>
          
          <div className="form-group">
            <label htmlFor="loginPassword">Password</label>
            <input
              id="loginPassword"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          
          <div className="auth-actions">
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
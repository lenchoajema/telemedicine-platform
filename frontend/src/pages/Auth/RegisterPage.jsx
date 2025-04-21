import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      addNotification('Passwords do not match', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      await register({
        email: formData.email,
        password: formData.password,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName
        },
        role: formData.role
      });
      
      addNotification('Registration successful!', 'success');
      navigate('/dashboard');
    } catch (err) {
      addNotification(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Get started with telemedicine</p>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="name-fields">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName" autoComplete="given-name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="8"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="role-selection">
            <label>I am a:</label>
            <div className="radio-group">
              <label htmlFor="patientRole">
                <input
                  id="patientRole"
                  type="radio"
                  name="role"
                  value="patient"
                  checked={formData.role === 'patient'}
                  onChange={handleChange}
                />
                Patient
              </label>
              
              <label htmlFor="doctorRole">
                <input
                  id="doctorRole"
                  type="radio"
                  name="role"
                  value="doctor"
                  checked={formData.role === 'doctor'}
                  onChange={handleChange}
                />
                Doctor
              </label>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
//import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import AuthForm from '../../../components/auth/AuthForm';
import Button from '../../../components/shared/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login({ email, password });
      showNotification('Login successful!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showNotification(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to access your account</p>
        
        <AuthForm onSubmit={handleSubmit}>
          <AuthForm.Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          
          <AuthForm.Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <div className="auth-actions">
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>
          
          <Button 
            type="submit" 
            loading={loading}
            fullWidth
          >
            Sign In
          </Button>
        </AuthForm>
        
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
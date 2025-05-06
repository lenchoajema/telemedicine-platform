import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import LoginPage from '../../pages/Auth/LoginPage';
import { jest, describe, test, expect } from '@jest/globals';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

describe('LoginPage', () => {
  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <NotificationProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </NotificationProvider>
      </BrowserRouter>
    );
  };

  test('renders login form', () => {
    renderLoginPage();
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('validates form input', async () => {
    renderLoginPage();
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Submit form without filling fields
    fireEvent.click(submitButton);
    
    // Check that validation is working (HTML5 validation will prevent submission)
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInvalid();
    });
  });

  test('submits form with valid data', async () => {
    // Mock the fetch function
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { email: 'test@example.com' }, token: 'fake-token' }),
      })
    );
    
    renderLoginPage();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if fetch was called with the right data
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test@example.com')
        })
      );
    });
  });
});

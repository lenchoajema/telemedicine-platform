// Polyfill TextEncoder and TextDecoder for Jest/node
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { BrowserRouter } = require('react-router-dom');
const { AuthProvider } = require('../../contexts/AuthContext.jsx');
const { NotificationProvider } = require('../../contexts/NotificationContext.jsx');
const LoginPage = require('../../pages/Auth/LoginPage').default;

// Mock the context providers
jest.mock('../../contexts/AuthContext.jsx', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: null, login: jest.fn(), register: jest.fn(), logout: jest.fn(), loading: false }),
}));

jest.mock('../../contexts/NotificationContext.jsx', () => ({
  NotificationProvider: ({ children }) => children,
  useNotifications: () => ({ addNotification: jest.fn(), removeNotification: jest.fn() }),
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

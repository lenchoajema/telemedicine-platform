// Polyfill TextEncoder and TextDecoder for Jest/node
import { TextEncoder, TextDecoder } from 'util';
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/Auth/LoginPage.jsx';
import apiClient from '../api/apiClient';

// Mock the context providers
jest.mock('../contexts/authContext.jsx', () => {
  const actual = jest.requireActual('../contexts/authContext.jsx');
  return {
    ...actual,
    AuthProvider: ({ children }) => children,
    // Do NOT mock useAuth, use the real one
  };
});

jest.mock('../contexts/NotificationContext.jsx', () => ({
  NotificationProvider: ({ children }) => children,
  useNotifications: () => ({ addNotification: jest.fn(), removeNotification: jest.fn() }),
}));

jest.mock('../api/apiClient', () => ({
  post: jest.fn((url, data) => {
    // Throw an error with the arguments to debug
    throw new Error(`apiClient.post called with URL: ${url}, Data: ${JSON.stringify(data)}`);
    // Or, if you want to continue execution after logging:
    // console.log(`apiClient.post called with URL: ${url}, Data: ${JSON.stringify(data)}`);
    // return Promise.resolve({ data: { user: { email: 'test@example.com' }, token: 'fake-token' } });
  }),
}));

describe('LoginPage', () => {
  const { AuthProvider } = jest.requireMock('../contexts/authContext.jsx');
  const { NotificationProvider } = jest.requireMock('../contexts/NotificationContext.jsx');

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
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('validates form input', async () => {
    renderLoginPage();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByLabelText('Email Address')).toBeInvalid();
    });
  });

  test('submits form with valid data', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: { user: { email: 'test@example.com' }, token: 'fake-token' }
    });
    renderLoginPage();
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Log the calls to apiClient.post
    console.log('apiClient.post calls:', apiClient.post.mock.calls);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/login',
        { email: 'test@example.com', password: 'password123' }
      );
    });
  });
});

<<<<<<< HEAD
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
=======
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

>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
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
<<<<<<< HEAD
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
=======
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('validates form input', async () => {
    renderLoginPage();
<<<<<<< HEAD
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Submit form without filling fields
    fireEvent.click(submitButton);
    
    // Check that validation is working (HTML5 validation will prevent submission)
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInvalid();
=======
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByLabelText('Email Address')).toBeInvalid();
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
    });
  });

  test('submits form with valid data', async () => {
<<<<<<< HEAD
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
=======
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
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
      );
    });
  });
});

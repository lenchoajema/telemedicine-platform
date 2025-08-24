import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  const locale = localStorage.getItem('locale') || 'en';
  config.headers['Accept-Language'] = locale;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor to handle global errors, like 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., by logging out the user
      localStorage.removeItem('token');
      // It's better to handle redirection in the UI layer (e.g., in AuthContext)
      // by checking for the token's presence or catching this specific error.
      console.error("Unauthorized access - 401. Token removed.");
    }

    // Enhance the error object with a more specific message
    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.error || 
      error.message;

    // It's often useful to pass a structured error to the UI
    const customError = {
      message: errorMessage,
      status: error.response?.status,
      originalError: error,
    };

    return Promise.reject(customError);
  }
);

export default apiClient;

import axios from 'axios';
import { PendingRequest } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Configured axios instance for API requests
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add authorization token
 * Automatically includes Authorization header with accessToken from sessionStorage
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor for error handling
 * Handles 401 Unauthorized responses by saving pending request and redirecting
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Save pending request for retry after re-authentication
      if (error.config) {
        const pendingRequest: PendingRequest = {
          url: error.config.url || '',
          method: error.config.method?.toUpperCase() || 'GET',
          body: error.config.data,
          headers: error.config.headers || {},
          timestamp: Date.now(),
        };
        sessionStorage.setItem('pendingRequest', JSON.stringify(pendingRequest));
      }
      
      // Clear stored token on authentication failure
      sessionStorage.removeItem('accessToken');
      // Redirect to home page (AuthContext will handle showing login)
      window.location.href = '/?session=expired';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
export { apiClient as api };

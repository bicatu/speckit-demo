import { PendingRequest } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const TIMEOUT_MS = 10000;

export class ApiError extends Error {
  readonly response: { status: number; data: unknown };
  readonly config: { url: string; method: string; data?: unknown; headers: Record<string, string> };

  constructor(
    message: string,
    response: { status: number; data: unknown },
    config: { url: string; method: string; data?: unknown; headers: Record<string, string> },
  ) {
    super(message);
    this.name = 'ApiError';
    this.response = response;
    this.config = config;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ data: T }> {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const token = sessionStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let responseData: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Save pending request for retry after re-authentication
        const pendingRequest: PendingRequest = {
          url,
          method: method.toUpperCase(),
          body,
          headers,
          timestamp: Date.now(),
        };
        sessionStorage.setItem('pendingRequest', JSON.stringify(pendingRequest));

        // Clear stored token on authentication failure
        sessionStorage.removeItem('accessToken');
        // Redirect to home page (AuthContext will handle showing login)
        window.location.href = '/?session=expired';
      }

      return Promise.reject(
        new ApiError(
          `Request failed with status ${response.status}`,
          { status: response.status, data: responseData },
          { url, method: method.toUpperCase(), data: body, headers },
        ),
      );
    }

    return { data: responseData as T };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Native fetch-based API client with authorization token injection,
 * 10-second timeout, and 401 session-expiry handling.
 */
export const apiClient = {
  get<T>(url: string): Promise<{ data: T }> {
    return request<T>('GET', url);
  },
  post<T>(url: string, data?: unknown): Promise<{ data: T }> {
    return request<T>('POST', url, data);
  },
  put<T>(url: string, data?: unknown): Promise<{ data: T }> {
    return request<T>('PUT', url, data);
  },
  delete<T = unknown>(url: string): Promise<{ data: T }> {
    return request<T>('DELETE', url);
  },
};

export default apiClient;
export { apiClient as api };

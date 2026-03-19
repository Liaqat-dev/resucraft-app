/**
 * Axios instance with automatic JWT token refresh.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  Change BASE_URL depending on where you're running:     │
 * │                                                         │
 * │  Android emulator  →  http://10.0.2.2:5000/api          │
 * │  iOS simulator     →  http://localhost:5000/api          │
 * │  Physical device   →  http://<YOUR_LAN_IP>:5000/api     │
 * │  (current LAN IP)  →  http://192.168.100.6:5000/api     │
 * └─────────────────────────────────────────────────────────┘
 */

import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── ⚙️  Set this to match your environment ───────────────────────────────────
// Android emulator:  'http://10.0.2.2:5000/api'
// iOS simulator:     'http://localhost:5000/api'
// Physical device:   'http://192.168.100.6:5000/api'
export const BASE_URL = 'http://192.168.0.111:5000/api';
export const ACCESS_TOKEN_KEY = 'resucraft_access_token';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
};

export const clearStoredToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    // Ignore errors during cleanup
  }
};

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Refresh token queue ──────────────────────────────────────────────────────
// Prevents multiple simultaneous refresh calls. All 401 requests queue up and
// wait for the single refresh to complete before retrying.
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ─── Request interceptor — attach Bearer token ────────────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor — handle 401 with token refresh ────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401 and only once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refresh is in-flight
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>).Authorization =
                `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<{ accessToken: string }>(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newToken = response.data.accessToken;
        await setStoredToken(newToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization =
            `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearStoredToken();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

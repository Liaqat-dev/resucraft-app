/**
 * Auth service — wraps all /auth/* API calls.
 * Stores / clears the access token via expo-secure-store through the api module.
 */

import { AxiosError } from 'axios';
import api, {
  ACCESS_TOKEN_KEY,
  clearStoredToken,
  setStoredToken,
} from './api';
import * as SecureStore from 'expo-secure-store';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfilePic {
  url: string;
  deleteUrl?: string;
}

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  name?: string;
  profilePic?: ProfilePic;
  isVerified: boolean;
  provider: 'local' | 'google';
  twoFactorEnabled?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Session {
  _id: string;
  device?: string;
  ip?: string;
  createdAt?: string;
  lastUsed?: string;
  isCurrent?: boolean;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
  maxAllowed: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const extractMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return (
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      'An unexpected error occurred'
    );
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

// ─── Auth service functions ───────────────────────────────────────────────────

/**
 * Login with email/username + password.
 * Stores access token in SecureStore on success.
 */
export const login = async (
  emailOrUsername: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', {
      emailOrUsername,
      password,
    });

    await setStoredToken(response.data.accessToken);
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
};

/**
 * Logout from the current device.
 * Clears the stored access token regardless of API success.
 */
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Continue with local cleanup even if API call fails
  } finally {
    await clearStoredToken();
  }
};

/**
 * Logout from all devices.
 */
export const logoutAll = async (): Promise<{ sessionsEnded: number }> => {
  try {
    const response = await api.post<{ sessionsEnded: number; message: string }>(
      '/auth/logout-all',
    );
    await clearStoredToken();
    return response.data;
  } catch (error) {
    await clearStoredToken();
    throw new Error(extractMessage(error));
  }
};

/**
 * Attempt to restore a session using the HttpOnly refresh token cookie.
 * Returns null if no valid session exists (user must log in).
 */
export const restoreSession = async (): Promise<string | null> => {
  try {
    const response = await api.post<{ accessToken: string }>('/auth/refresh');
    const token = response.data.accessToken;
    await setStoredToken(token);
    return token;
  } catch {
    await clearStoredToken();
    return null;
  }
};

/**
 * Fetch the authenticated user's profile.
 */
export const getProfile = async (): Promise<AuthUser> => {
  try {
    const response = await api.get<AuthUser>('/auth/profile');
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
};

/**
 * Update account info — username and/or profile picture.
 * Sends multipart/form-data.
 */
export const updateAccountInfo = async (data: {
  username?: string;
  profilePicUri?: string;
  profilePicType?: string;
  profilePicName?: string;
}): Promise<AuthUser> => {
  try {
    const formData = new FormData();

    if (data.username !== undefined) {
      formData.append('username', data.username);
    }

    if (data.profilePicUri) {
      formData.append('profilePic', {
        uri: data.profilePicUri,
        type: data.profilePicType ?? 'image/jpeg',
        name: data.profilePicName ?? 'profile.jpg',
      } as unknown as Blob);
    }

    const response = await api.put<{ user: AuthUser; message: string }>(
      '/auth/update-account-info',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    return response.data.user;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
};

/**
 * Change password (local accounts only).
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<string> => {
  try {
    const response = await api.post<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data.message;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
};

/**
 * Get all active sessions for the current user.
 */
export const getSessions = async (): Promise<SessionsResponse> => {
  try {
    const response = await api.get<SessionsResponse>('/auth/sessions');
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
};

/**
 * Revoke a specific session by ID.
 */
export const revokeSession = async (sessionId: string): Promise<void> => {
  try {
    await api.delete(`/auth/sessions/${sessionId}`);
  } catch (error) {
    throw new Error(extractMessage(error));
  }
};

// ─── Register ─────────────────────────────────────────────────────────────────

export interface SignupResponse {
  message: string;
  user: { _id: string; email: string; username: string };
}

/**
 * Register a new local account.
 * Backend sends a verification email — user must verify before logging in.
 */
export const signup = async (
  username: string,
  email: string,
  password: string,
): Promise<SignupResponse> => {
  try {
    const response = await api.post<SignupResponse>('/auth/signup', {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
};

/**
 * Verify email with the 6-digit code sent after registration.
 */
export const verifyEmail = async (
  email: string,
  code: string,
): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>('/auth/verify-email', {
      email,
      code,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
};

/**
 * Resend verification email.
 */
export const resendVerificationCode = async (
  email: string,
): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>('/auth/resend-code', { email });
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
};

/**
 * Check whether an access token exists in secure storage.
 * Used to determine initial auth state before a refresh call completes.
 */
export const hasStoredToken = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    return token !== null && token.length > 0;
  } catch {
    return false;
  }
};

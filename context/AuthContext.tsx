/**
 * AuthContext — provides authentication state and actions to the entire app.
 *
 * On mount it attempts to restore a session via the HttpOnly refresh-token cookie.
 * All screens that need auth state consume the `useAuth()` hook.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import {
  AuthUser,
  getProfile,
  logout as logoutService,
  logoutAll as logoutAllService,
  restoreSession,
  updateAccountInfo as updateAccountInfoService,
} from '@/services/authService';
import { PersonalInfo, getPersonalInfo } from '@/services/profileService';

// ─── State shape ──────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  personalInfo: PersonalInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoringSession: boolean;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type AuthAction =
  | { type: 'RESTORE_SESSION_START' }
  | { type: 'RESTORE_SESSION_SUCCESS'; payload: AuthUser }
  | { type: 'RESTORE_SESSION_FAIL' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthUser }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: AuthUser }
  | { type: 'SET_PERSONAL_INFO'; payload: PersonalInfo }
  | { type: 'SET_LOADING'; payload: boolean };

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  personalInfo: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoringSession: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_SESSION_START':
      return { ...state, isRestoringSession: true };

    case 'RESTORE_SESSION_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isRestoringSession: false,
      };

    case 'RESTORE_SESSION_FAIL':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isRestoringSession: false,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        personalInfo: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'SET_PERSONAL_INFO':
      return { ...state, personalInfo: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  loginSuccess: (user: AuthUser) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshPersonalInfo: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  updatePersonalInfoState: (info: PersonalInfo) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Attempt to restore session from HttpOnly cookie on app start
  useEffect(() => {
    let mounted = true;

    const tryRestoreSession = async () => {
      dispatch({ type: 'RESTORE_SESSION_START' });

      try {
        const token = await restoreSession();

        if (!token || !mounted) {
          dispatch({ type: 'RESTORE_SESSION_FAIL' });
          return;
        }

        const user = await getProfile();

        if (!mounted) return;

        dispatch({ type: 'RESTORE_SESSION_SUCCESS', payload: user });

        // Also fetch personal info in parallel on restore
        try {
          const info = await getPersonalInfo();
          if (mounted) {
            dispatch({ type: 'SET_PERSONAL_INFO', payload: info });
          }
        } catch {
          // Non-fatal — personal info can be fetched on demand
        }
      } catch {
        if (mounted) {
          dispatch({ type: 'RESTORE_SESSION_FAIL' });
        }
      }
    };

    tryRestoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const loginSuccess = useCallback((user: AuthUser) => {
    dispatch({ type: 'LOGIN_SUCCESS', payload: user });
  }, []);

  const logout = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await logoutService();
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const logoutAll = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await logoutAllService();
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await getProfile();
      dispatch({ type: 'SET_USER', payload: user });
    } catch {
      // Token may have expired — the api interceptor will handle refresh
    }
  }, []);

  const refreshPersonalInfo = useCallback(async () => {
    try {
      const info = await getPersonalInfo();
      dispatch({ type: 'SET_PERSONAL_INFO', payload: info });
    } catch {
      // Non-fatal
    }
  }, []);

  const updateUser = useCallback((user: AuthUser) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const updatePersonalInfoState = useCallback((info: PersonalInfo) => {
    dispatch({ type: 'SET_PERSONAL_INFO', payload: info });
  }, []);

  const value: AuthContextValue = {
    ...state,
    loginSuccess,
    logout,
    logoutAll,
    refreshUser,
    refreshPersonalInfo,
    updateUser,
    updatePersonalInfoState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

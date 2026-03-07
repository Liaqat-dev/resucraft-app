/**
 * Profile service — wraps all /personal-info API calls.
 */

import { AxiosError } from 'axios';
import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersonalInfo {
  _id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  profession?: string;
  email?: string;
  dob?: string;
  bio?: string;
  phone?: string;
  address?: string;
  github?: string;
  linkedin?: string;
}

interface PersonalInfoResponse {
  success: boolean;
  personalInfo: PersonalInfo;
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

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Fetch the current user's personal info.
 * Backend auto-creates an empty document if none exists.
 */
export const getPersonalInfo = async (): Promise<PersonalInfo> => {
  try {
    const response = await api.get<PersonalInfoResponse>('/personal-info');
    return response.data.personalInfo;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
};

/**
 * Update personal info fields (partial update — send only changed fields).
 */
export const updatePersonalInfo = async (
  data: Partial<PersonalInfo>,
): Promise<PersonalInfo> => {
  try {
    const response = await api.put<PersonalInfoResponse>('/personal-info', data);
    return response.data.personalInfo;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
};

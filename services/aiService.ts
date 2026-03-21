import api from './api';
import { AxiosError } from 'axios';

const msg = (e: unknown): string => {
  if (e instanceof AxiosError)
    return (e.response?.data as { message?: string })?.message ?? e.message ?? 'Error';
  if (e instanceof Error) return e.message;
  return 'An unexpected error occurred';
};

export interface GenerateResumeResult {
  success: boolean;
  filledTemplate: { _id: string; name: string; data: any };
}

export const generateResume = async (
  templateId: string,
  jobDescription: string,
): Promise<GenerateResumeResult> => {
  try {
    const r = await api.post('/ai/generate-resume', { templateId, jobDescription });
    return r.data;
  } catch (e) {
    throw new Error(msg(e));
  }
};

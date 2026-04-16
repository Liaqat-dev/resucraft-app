import { AxiosError } from 'axios';
import api from './api';

// ─── Helper ───────────────────────────────────────────────────────────────────

const msg = (e: unknown): string => {
  if (e instanceof AxiosError)
    return (e.response?.data as { message?: string })?.message ?? e.message ?? 'Error';
  if (e instanceof Error) return e.message;
  return 'An unexpected error occurred';
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TemplateData {
  elements?: any[];
  sections?: any[];
  canvasSettings?: { width?: string; height?: string; background?: string };
}

export type TemplateCategory = 'Modern' | 'Classic' | 'Creative' | 'Minimal' | 'Professional' | 'Other';

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Modern', 'Classic', 'Creative', 'Minimal', 'Professional', 'Other',
];

export interface Template {
  _id: string;
  name: string;
  category: TemplateCategory;
  data: TemplateData;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const listTemplates = async (): Promise<Template[]> => {
  try {
    const r = await api.get('/templates');
    return r.data.templates ?? [];
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const listAllTemplates = async (): Promise<Template[]> => {
  try {
    const r = await api.get('/templates/all');
    return r.data.templates ?? [];
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    await api.delete(`/templates/${id}`);
  } catch (e) {
    throw new Error(msg(e));
  }
};

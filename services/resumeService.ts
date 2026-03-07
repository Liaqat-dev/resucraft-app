/**
 * Resume service — CRUD for education, experience, skills, projects, certificates.
 */

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

export interface Education {
  _id: string;
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Experience {
  _id: string;
  company: string;
  role: string;
  description?: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
}

export interface Skill {
  _id: string;
  name: string;
  category: 'Technical' | 'Soft' | 'Other';
}

export interface Project {
  _id: string;
  title: string;
  description?: string;
  liveUrl?: string;
  repoUrl?: string;
  startDate?: string;
  endDate?: string;
  technologies: string[];
  status: 'planned' | 'in-progress' | 'completed';
}

export interface Certificate {
  _id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

// ─── Education ────────────────────────────────────────────────────────────────

export const getEducation = async (): Promise<Education[]> => {
  try {
    const r = await api.get('/education');
    return r.data.educations ?? [];
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const createEducation = async (
  data: Omit<Education, '_id'>,
): Promise<Education> => {
  try {
    const r = await api.post('/education', data);
    return r.data.education;
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const updateEducation = async (
  id: string,
  data: Partial<Omit<Education, '_id'>>,
): Promise<Education> => {
  try {
    const r = await api.put(`/education/${id}`, data);
    return r.data.education;
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const deleteEducation = async (id: string): Promise<void> => {
  try {
    await api.delete(`/education/${id}`);
  } catch (e) {
    throw new Error(msg(e));
  }
};

// ─── Experience ───────────────────────────────────────────────────────────────

export const getExperience = async (): Promise<Experience[]> => {
  try {
    const r = await api.get('/experience');
    return r.data.experiences ?? [];
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const createExperience = async (
  data: Omit<Experience, '_id'>,
): Promise<Experience> => {
  try {
    const r = await api.post('/experience', data);
    return r.data.experience;
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const updateExperience = async (
  id: string,
  data: Partial<Omit<Experience, '_id'>>,
): Promise<Experience> => {
  try {
    const r = await api.put(`/experience/${id}`, data);
    return r.data.experience;
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const deleteExperience = async (id: string): Promise<void> => {
  try {
    await api.delete(`/experience/${id}`);
  } catch (e) {
    throw new Error(msg(e));
  }
};

// ─── Skills ───────────────────────────────────────────────────────────────────

export const getSkills = async (): Promise<Skill[]> => {
  try {
    const r = await api.get('/skills');
    return r.data.skills ?? [];
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const createSkills = async (
  skills: Array<{ name: string; category: string }>,
): Promise<Skill[]> => {
  try {
    const r = await api.post('/skills', { skills });
    return r.data.skills ?? [];
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const deleteSkill = async (id: string): Promise<void> => {
  try {
    await api.delete(`/skills/${id}`);
  } catch (e) {
    throw new Error(msg(e));
  }
};

// ─── Projects ─────────────────────────────────────────────────────────────────

export const getProjects = async (): Promise<Project[]> => {
  try {
    const r = await api.get('/projects');
    return r.data.projects ?? [];
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const createProject = async (
  data: Omit<Project, '_id'>,
): Promise<Project> => {
  try {
    const r = await api.post('/projects', data);
    return r.data.project;
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const updateProject = async (
  id: string,
  data: Partial<Omit<Project, '_id'>>,
): Promise<Project> => {
  try {
    const r = await api.put(`/projects/${id}`, data);
    return r.data.project;
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    await api.delete(`/projects/${id}`);
  } catch (e) {
    throw new Error(msg(e));
  }
};

// ─── Certificates ─────────────────────────────────────────────────────────────

export const getCertificates = async (): Promise<Certificate[]> => {
  try {
    const r = await api.get('/certificates');
    return r.data.certificates ?? [];
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const createCertificate = async (
  data: Omit<Certificate, '_id'>,
): Promise<Certificate> => {
  try {
    const r = await api.post('/certificates', data);
    return r.data.certificate;
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const updateCertificate = async (
  id: string,
  data: Partial<Omit<Certificate, '_id'>>,
): Promise<Certificate> => {
  try {
    const r = await api.put(`/certificates/${id}`, data);
    return r.data.certificate;
  } catch (e) {
    throw new Error(msg(e));
  }
};

export const deleteCertificate = async (id: string): Promise<void> => {
  try {
    await api.delete(`/certificates/${id}`);
  } catch (e) {
    throw new Error(msg(e));
  }
};

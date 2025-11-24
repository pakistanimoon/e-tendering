import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    company_name: string;
    role: string;
  }) => api.post('/api/auth/register', data),
  
  me: () => api.get('/api/auth/me'),
};

// Organization API
export const organizationAPI = {
  createProject: (data: any) =>
    api.post('/api/organization/projects', data),
  
  getProjects: (status?: string) =>
    api.get('/api/organization/projects', { params: { status_filter: status } }),
  
  getProject: (id: number) =>
    api.get(`/api/organization/projects/${id}`),
  
  updateProject: (id: number, data: any) =>
    api.put(`/api/organization/projects/${id}`, data),
  
  publishProject: (id: number) =>
    api.post(`/api/organization/projects/${id}/publish`),
  
  getEvaluations: (projectId: number) =>
    api.get(`/api/organization/projects/${projectId}/evaluations`),
  
  awardContract: (projectId: number, bidId: number) =>
    api.post(`/api/organization/projects/${projectId}/award/${bidId}`),
};

// Bidder API
export const bidderAPI = {
  getActiveProjects: () =>
    api.get('/api/bidder/projects'),
  
  getProject: (id: number) =>
    api.get(`/api/bidder/projects/${id}`),
  
  createBid: (data: {
    project_id: number;
    bid_amount: number;
    currency: string;
    cover_letter?: string;
  }) => api.post('/api/bidder/bids', data),
  
  uploadDocument: (bidId: number, formData: FormData) =>
    api.post(`/api/bidder/bids/${bidId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  submitBid: (bidId: number) =>
    api.post(`/api/bidder/bids/${bidId}/submit`),
  
  getMyBids: () =>
    api.get('/api/bidder/my-bids'),
  
  getEvaluation: (bidId: number) =>
    api.get(`/api/bidder/bids/${bidId}/evaluation`),
};

// Evaluation API
export const evaluationAPI = {
  triggerEvaluation: (bidId: number) =>
    api.post(`/api/evaluation/evaluate/${bidId}`),
  
  compareAll: (projectId: number) =>
    api.post(`/api/evaluation/compare/${projectId}`),
};

export default api;
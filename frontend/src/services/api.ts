import axios from 'axios';
import { 
  HealthResponse, 
  AuthResponse, 
  User, 
  Workspace, 
  WorkspaceMember, 
  FileItem, 
  InviteResponse,
  CreateWorkspaceInput
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1` 
  : '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Automatic JWT Authorization header injection
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('codesync_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handler (e.g. token expiration)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
      localStorage.removeItem('codesync_auth_token');
      localStorage.removeItem('codesync_auth_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // System Health
  getHealth: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  },

  // Authentication
  register: async (payload: { email: string; username: string; password: string; full_name?: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },

  login: async (payload: { username_or_email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // Workspaces
  getWorkspaces: async (): Promise<Workspace[]> => {
    const response = await apiClient.get<Workspace[]>('/workspaces');
    return response.data;
  },

  getWorkspace: async (id: string): Promise<Workspace> => {
    const response = await apiClient.get<Workspace>(`/workspaces/${id}`);
    return response.data;
  },

  createWorkspace: async (payload: CreateWorkspaceInput): Promise<Workspace> => {
    const response = await apiClient.post<Workspace>('/workspaces', payload);
    return response.data;
  },

  updateWorkspace: async (id: string, payload: Partial<CreateWorkspaceInput>): Promise<Workspace> => {
    const response = await apiClient.patch<Workspace>(`/workspaces/${id}`, payload);
    return response.data;
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${id}`);
  },

  createInvite: async (workspaceId: string, role: string = 'editor'): Promise<InviteResponse> => {
    const response = await apiClient.post<InviteResponse>(`/workspaces/${workspaceId}/invite`, { role });
    return response.data;
  },

  joinWorkspace: async (token: string): Promise<Workspace> => {
    const response = await apiClient.post<Workspace>('/workspaces/join', { token });
    return response.data;
  },

  getWorkspaceMembers: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const response = await apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
    return response.data;
  },

  // File Management
  getFiles: async (workspaceId: string): Promise<FileItem[]> => {
    const response = await apiClient.get<FileItem[]>(`/workspaces/${workspaceId}/files`);
    return response.data;
  },

  createFile: async (workspaceId: string, payload: { name: string; path: string; is_directory?: boolean; language?: string; content?: string }): Promise<FileItem> => {
    const response = await apiClient.post<FileItem>(`/workspaces/${workspaceId}/files`, payload);
    return response.data;
  },

  getFile: async (fileId: string): Promise<FileItem> => {
    const response = await apiClient.get<FileItem>(`/files/${fileId}`);
    return response.data;
  },

  updateFile: async (fileId: string, payload: { name?: string; path?: string; content?: string; language?: string }): Promise<FileItem> => {
    const response = await apiClient.patch<FileItem>(`/files/${fileId}`, payload);
    return response.data;
  },

  deleteFile: async (fileId: string): Promise<void> => {
    await apiClient.delete(`/files/${fileId}`);
  },
};

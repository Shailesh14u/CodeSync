import axios from 'axios';
import { 
  HealthResponse, 
  AuthResponse, 
  User, 
  Workspace, 
  WorkspaceMember, 
  FileItem, 
  InviteResponse,
  CreateWorkspaceInput,
  ExecutionResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1` 
  : '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Automatic JWT Authorization header injection
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('codesync_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handler
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

  // Code Execution Engine
  runCode: async (payload: {
    workspace_id: string;
    language: string;
    entrypoint: string;
    files?: Array<{ name: string; content: string }>;
    stdin?: string;
    timeout_sec?: number;
  }): Promise<ExecutionResponse> => {
    const response = await apiClient.post<ExecutionResponse>('/executions', payload);
    return response.data;
  },

  getExecutionHistory: async (workspaceId: string): Promise<ExecutionResponse[]> => {
    const response = await apiClient.get<ExecutionResponse[]>(`/executions/workspaces/${workspaceId}/history`);
    return response.data;
  },

  // AI Development Assistant
  queryAI: async (payload: {
    workspace_id: string;
    action: 'explain' | 'debug' | 'generate' | 'optimize' | 'review' | 'complexity' | 'tests';
    code: string;
    language?: string;
    instruction?: string;
    error_trace?: string;
    api_key?: string;
    provider?: string;
    model_name?: string;
  }): Promise<AIResponse> => {
    const response = await apiClient.post<AIResponse>('/ai/query', payload);
    return response.data;
  },

  sendAIFeedback: async (requestId: string, accepted: boolean): Promise<{ status: string; accepted: boolean }> => {
    const response = await apiClient.post<{ status: string; accepted: boolean }>(`/ai/${requestId}/feedback`, { accepted });
    return response.data;
  },

  // Version History / Snapshots
  createSnapshot: async (workspaceId: string, payload: { name: string; description?: string }): Promise<SnapshotItem> => {
    const response = await apiClient.post<SnapshotItem>(`/workspaces/${workspaceId}/snapshots`, payload);
    return response.data;
  },

  getSnapshots: async (workspaceId: string): Promise<SnapshotItem[]> => {
    const response = await apiClient.get<SnapshotItem[]>(`/workspaces/${workspaceId}/snapshots`);
    return response.data;
  },

  getSnapshot: async (snapshotId: string): Promise<SnapshotDetail> => {
    const response = await apiClient.get<SnapshotDetail>(`/snapshots/${snapshotId}`);
    return response.data;
  },

  restoreSnapshot: async (snapshotId: string): Promise<{ status: string; message: string; restored_files_count: number }> => {
    const response = await apiClient.post<{ status: string; message: string; restored_files_count: number }>(`/snapshots/${snapshotId}/restore`);
    return response.data;
  },

  // Workspace Chat / Messaging
  getMessages: async (workspaceId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get<ChatMessage[]>(`/workspaces/${workspaceId}/messages`);
    return response.data;
  },

  sendMessage: async (workspaceId: string, content: string): Promise<ChatMessage> => {
    const response = await apiClient.post<ChatMessage>(`/workspaces/${workspaceId}/messages`, { content });
    return response.data;
  },

  // Interview Mode
  getInterview: async (workspaceId: string): Promise<InterviewSession> => {
    const response = await apiClient.get<InterviewSession>(`/workspaces/${workspaceId}/interview`);
    return response.data;
  },

  configureInterview: async (workspaceId: string, payload: Partial<InterviewSession>): Promise<InterviewSession> => {
    const response = await apiClient.post<InterviewSession>(`/workspaces/${workspaceId}/interview`, payload);
    return response.data;
  },

  evaluateInterview: async (workspaceId: string, payload: { code: string; language: string }): Promise<InterviewEvaluateResponse> => {
    const response = await apiClient.post<InterviewEvaluateResponse>(`/workspaces/${workspaceId}/interview/evaluate`, payload);
    return response.data;
  },

  generateInterviewFeedback: async (workspaceId: string, payload: { code: string; language: string }): Promise<{ status: string; feedback: string; score: number }> => {
    const response = await apiClient.post<{ status: string; feedback: string; score: number }>(`/workspaces/${workspaceId}/interview/feedback`, payload);
    return response.data;
  },
};

export interface SnapshotItem {
  id: string;
  workspace_id: string;
  created_by_id?: string;
  name: string;
  description?: string;
  file_count: number;
  created_at: string;
}

export interface SnapshotDetail extends SnapshotItem {
  files_data: Array<{
    name: string;
    path: string;
    language: string;
    content: string;
  }>;
}

export interface ChatMessage {
  id: string;
  workspace_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

export interface TestCase {
  id: number;
  input: string;
  expected_output: string;
  hidden: boolean;
}

export interface TestCaseResult {
  test_id: number;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  hidden: boolean;
  error?: string;
  execution_time_ms: number;
}

export interface InterviewEvaluateResponse {
  score: number;
  total_tests: number;
  passed_tests: number;
  status: string;
  results: TestCaseResult[];
  ai_feedback?: string;
}

export interface InterviewSession {
  id: string;
  workspace_id: string;
  interviewer_id?: string;
  candidate_id?: string;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  time_limit_minutes: number;
  test_cases: TestCase[];
  status: string;
  score?: number;
  ai_feedback?: string;
  created_at: string;
}

export interface AIComplexity {
  time_complexity: string;
  space_complexity: string;
  explanation?: string;
}

export interface AIResponse {
  request_id: string;
  action: string;
  explanation: string;
  suggested_code: string;
  reasoning: string;
  risks: string;
  complexity?: AIComplexity;
  provider: string;
}

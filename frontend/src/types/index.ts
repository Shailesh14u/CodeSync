export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  environment: string;
  timestamp: string;
  database: {
    connected: boolean;
    dialect: string;
    error?: string | null;
  };
  services: {
    api: string;
    collaboration_ws: string;
    ai_provider: string;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  default_language: string;
  is_public: boolean;
  owner_id: string;
  role: string; // owner | editor | viewer | candidate
  members_count: number;
  files_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  username: string;
  email: string;
  full_name?: string | null;
  created_at: string;
}

export interface FileItem {
  id: string;
  workspace_id: string;
  name: string;
  path: string;
  is_directory: boolean;
  parent_id?: string | null;
  language: string;
  content: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface InviteResponse {
  id: string;
  workspace_id: string;
  token: string;
  role: string;
  expires_at: string;
  invite_url: string;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  default_language?: string;
  is_public?: boolean;
}

export interface CollabUser {
  name: string;
  color: string;
  id?: string;
}

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
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

import { create } from 'zustand';
import { Workspace, FileItem, WorkspaceMember, CreateWorkspaceInput } from '../types';
import { apiService } from '../services/api';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  files: FileItem[];
  members: WorkspaceMember[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (payload: CreateWorkspaceInput) => Promise<Workspace | null>;
  deleteWorkspace: (id: string) => Promise<boolean>;
  joinWorkspace: (token: string) => Promise<Workspace | null>;
  selectWorkspace: (workspace: Workspace | null) => void;
  fetchFiles: (workspaceId: string) => Promise<void>;
  createFile: (workspaceId: string, payload: { name: string; path: string; is_directory?: boolean; language?: string; content?: string }) => Promise<FileItem | null>;
  deleteFile: (fileId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  files: [],
  members: [],
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspaces = await apiService.getWorkspaces();
      set({ workspaces, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to fetch workspaces.',
        isLoading: false,
      });
    }
  },

  createWorkspace: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const newWs = await apiService.createWorkspace(payload);
      set((state) => ({
        workspaces: [newWs, ...state.workspaces],
        isLoading: false,
      }));
      return newWs;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to create workspace.',
        isLoading: false,
      });
      return null;
    }
  },

  deleteWorkspace: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.deleteWorkspace(id);
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
        currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to delete workspace.',
        isLoading: false,
      });
      return false;
    }
  },

  joinWorkspace: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const ws = await apiService.joinWorkspace(token);
      await get().fetchWorkspaces();
      set({ isLoading: false });
      return ws;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Invalid or expired invitation token.',
        isLoading: false,
      });
      return null;
    }
  },

  selectWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  },

  fetchFiles: async (workspaceId) => {
    try {
      const files = await apiService.getFiles(workspaceId);
      set({ files });
    } catch (err: any) {
      console.error('Failed to fetch workspace files', err);
    }
  },

  createFile: async (workspaceId, payload) => {
    try {
      const file = await apiService.createFile(workspaceId, payload);
      set((state) => ({
        files: [...state.files, file],
      }));
      return file;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to create file.' });
      return null;
    }
  },

  deleteFile: async (fileId) => {
    try {
      await apiService.deleteFile(fileId);
      set((state) => ({
        files: state.files.filter((f) => f.id !== fileId),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to delete file.' });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

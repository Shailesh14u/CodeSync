import { create } from 'zustand';
import { FileItem, CollabUser } from '../types';

interface EditorState {
  openTabs: FileItem[];
  activeFileId: string | null;
  fileContents: Record<string, string>; // fileId -> current content in editor
  dirtyFiles: Record<string, boolean>;  // fileId -> boolean has unsaved edits
  saveStatus: 'saved' | 'saving' | 'unsaved';

  // Real-time Collaboration & Presence
  collabStatus: 'connecting' | 'connected' | 'disconnected';
  collabUsers: CollabUser[];

  // Panels layout state
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  isBottomPanelOpen: boolean;
  activeRightTab: 'ai' | 'chat' | 'collaborators';
  activeBottomTab: 'terminal' | 'output' | 'problems';

  // Actions
  openFile: (file: FileItem) => void;
  closeTab: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  markFileSaved: (fileId: string, savedContent: string) => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void;
  setCollabStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
  setCollabUsers: (users: CollabUser[]) => void;
  setLanguage: (fileId: string, language: string) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleBottomPanel: () => void;
  setActiveRightTab: (tab: 'ai' | 'chat' | 'collaborators') => void;
  setActiveBottomTab: (tab: 'terminal' | 'output' | 'problems') => void;
  resetEditor: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  openTabs: [],
  activeFileId: null,
  fileContents: {},
  dirtyFiles: {},
  saveStatus: 'saved',

  collabStatus: 'disconnected',
  collabUsers: [],

  isLeftSidebarOpen: true,
  isRightSidebarOpen: true,
  isBottomPanelOpen: true,
  activeRightTab: 'ai',
  activeBottomTab: 'output',

  openFile: (file) => {
    const { openTabs, fileContents } = get();
    const alreadyOpen = openTabs.some((t) => t.id === file.id);

    const updatedTabs = alreadyOpen ? openTabs : [...openTabs, file];
    const updatedContents = {
      ...fileContents,
      [file.id]: fileContents[file.id] !== undefined ? fileContents[file.id] : file.content,
    };

    set({
      openTabs: updatedTabs,
      activeFileId: file.id,
      fileContents: updatedContents,
    });
  },

  closeTab: (fileId) => {
    const { openTabs, activeFileId } = get();
    const tabIndex = openTabs.findIndex((t) => t.id === fileId);
    const updatedTabs = openTabs.filter((t) => t.id !== fileId);

    let nextActiveId = activeFileId;
    if (activeFileId === fileId) {
      if (updatedTabs.length > 0) {
        const nextIndex = Math.min(tabIndex, updatedTabs.length - 1);
        nextActiveId = updatedTabs[nextIndex].id;
      } else {
        nextActiveId = null;
      }
    }

    set({
      openTabs: updatedTabs,
      activeFileId: nextActiveId,
    });
  },

  updateFileContent: (fileId, content) => {
    set((state) => ({
      fileContents: {
        ...state.fileContents,
        [fileId]: content,
      },
      dirtyFiles: {
        ...state.dirtyFiles,
        [fileId]: true,
      },
      saveStatus: 'unsaved',
    }));
  },

  markFileSaved: (fileId, savedContent) => {
    set((state) => ({
      openTabs: state.openTabs.map((tab) =>
        tab.id === fileId ? { ...tab, content: savedContent, size_bytes: savedContent.length } : tab
      ),
      dirtyFiles: {
        ...state.dirtyFiles,
        [fileId]: false,
      },
      saveStatus: 'saved',
    }));
  },

  setSaveStatus: (status) => set({ saveStatus: status }),
  setCollabStatus: (collabStatus) => set({ collabStatus }),
  setCollabUsers: (collabUsers) => set({ collabUsers }),

  setLanguage: (fileId, language) => {
    set((state) => ({
      openTabs: state.openTabs.map((tab) =>
        tab.id === fileId ? { ...tab, language } : tab
      ),
    }));
  },

  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  toggleBottomPanel: () => set((state) => ({ isBottomPanelOpen: !state.isBottomPanelOpen })),
  setActiveRightTab: (tab) => set({ activeRightTab: tab, isRightSidebarOpen: true }),
  setActiveBottomTab: (tab) => set({ activeBottomTab: tab, isBottomPanelOpen: true }),

  resetEditor: () =>
    set({
      openTabs: [],
      activeFileId: null,
      fileContents: {},
      dirtyFiles: {},
      saveStatus: 'saved',
      collabStatus: 'disconnected',
      collabUsers: [],
    }),
}));

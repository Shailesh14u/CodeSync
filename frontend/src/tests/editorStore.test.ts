import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../stores/editorStore';
import { FileItem } from '../types';

describe('editorStore state management', () => {
  const dummyFile1: FileItem = {
    id: 'f-1',
    workspace_id: 'ws-1',
    name: 'main.py',
    path: '/main.py',
    is_directory: false,
    language: 'python',
    content: 'print("hello")',
    size_bytes: 14,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const dummyFile2: FileItem = {
    id: 'f-2',
    workspace_id: 'ws-1',
    name: 'styles.css',
    path: '/styles.css',
    is_directory: false,
    language: 'css',
    content: 'body { color: white; }',
    size_bytes: 22,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  it('opens file tab and activates file', () => {
    useEditorStore.getState().openFile(dummyFile1);

    const state = useEditorStore.getState();
    expect(state.openTabs.length).toBe(1);
    expect(state.activeFileId).toBe('f-1');
    expect(state.fileContents['f-1']).toBe('print("hello")');
    expect(state.dirtyFiles['f-1']).toBeFalsy();
  });

  it('does not duplicate tab when opening already open file', () => {
    useEditorStore.getState().openFile(dummyFile1);
    useEditorStore.getState().openFile(dummyFile1);

    const state = useEditorStore.getState();
    expect(state.openTabs.length).toBe(1);
    expect(state.activeFileId).toBe('f-1');
  });

  it('switches active file when opening another file', () => {
    useEditorStore.getState().openFile(dummyFile1);
    useEditorStore.getState().openFile(dummyFile2);

    const state = useEditorStore.getState();
    expect(state.openTabs.length).toBe(2);
    expect(state.activeFileId).toBe('f-2');
  });

  it('updates file content and marks dirty', () => {
    useEditorStore.getState().openFile(dummyFile1);
    useEditorStore.getState().updateFileContent('f-1', 'print("updated code")');

    const state = useEditorStore.getState();
    expect(state.fileContents['f-1']).toBe('print("updated code")');
    expect(state.dirtyFiles['f-1']).toBe(true);
    expect(state.saveStatus).toBe('unsaved');
  });

  it('marks file saved and resets dirty flag', () => {
    useEditorStore.getState().openFile(dummyFile1);
    useEditorStore.getState().updateFileContent('f-1', 'saved content');
    expect(useEditorStore.getState().dirtyFiles['f-1']).toBe(true);

    useEditorStore.getState().markFileSaved('f-1', 'saved content');

    const state = useEditorStore.getState();
    expect(state.dirtyFiles['f-1']).toBeFalsy();
    expect(state.saveStatus).toBe('saved');
  });

  it('closes tab and switches active file to neighbor', () => {
    useEditorStore.getState().openFile(dummyFile1);
    useEditorStore.getState().openFile(dummyFile2);
    expect(useEditorStore.getState().activeFileId).toBe('f-2');

    useEditorStore.getState().closeTab('f-2');

    const state = useEditorStore.getState();
    expect(state.openTabs.length).toBe(1);
    expect(state.activeFileId).toBe('f-1');
  });

  it('toggles layout panels correctly', () => {
    expect(useEditorStore.getState().isLeftSidebarOpen).toBe(true);
    useEditorStore.getState().toggleLeftSidebar();
    expect(useEditorStore.getState().isLeftSidebarOpen).toBe(false);

    expect(useEditorStore.getState().isBottomPanelOpen).toBe(true);
    useEditorStore.getState().toggleBottomPanel();
    expect(useEditorStore.getState().isBottomPanelOpen).toBe(false);

    expect(useEditorStore.getState().isRightSidebarOpen).toBe(true);
    useEditorStore.getState().toggleRightSidebar();
    expect(useEditorStore.getState().isRightSidebarOpen).toBe(false);
  });
});

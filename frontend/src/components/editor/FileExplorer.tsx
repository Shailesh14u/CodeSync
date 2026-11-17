import React, { useState } from 'react';
import { 
  File, 
  Folder, 
  FolderOpen, 
  FilePlus, 
  FolderPlus, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronDown,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { FileItem } from '../../types';
import { useEditorStore } from '../../stores/editorStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';

export interface FileExplorerProps {
  workspaceId: string;
  files: FileItem[];
  onRefresh: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  workspaceId,
  files,
  onRefresh,
}) => {
  const { openFile, activeFileId } = useEditorStore();
  const { createFile, deleteFile } = useWorkspaceStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleCreateItem = async (isDirectory: boolean) => {
    if (!newItemName.trim()) {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      return;
    }

    let cleanName = newItemName.trim();
    let cleanPath = `/${cleanName}`;
    if (isDirectory && !cleanPath.endsWith('/')) {
      cleanPath += '/';
    }

    const created = await createFile(workspaceId, {
      name: cleanName,
      path: cleanPath,
      is_directory: isDirectory,
      content: isDirectory ? '' : '',
    });

    if (created && !isDirectory) {
      openFile(created);
    }

    setNewItemName('');
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
  };

  const handleDelete = async (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      await deleteFile(file.id);
    }
  };

  const getFileIcon = (filename: string, isDirectory: boolean, isExpanded: boolean) => {
    if (isDirectory) {
      return isExpanded ? (
        <FolderOpen className="w-4 h-4 text-accent-secondary shrink-0" />
      ) : (
        <Folder className="w-4 h-4 text-accent-secondary shrink-0" />
      );
    }

    const lower = filename.toLowerCase();
    if (lower.endsWith('.py')) return <span className="text-amber-400 font-bold text-xs shrink-0">🐍</span>;
    if (lower.endsWith('.cpp') || lower.endsWith('.c') || lower.endsWith('.h')) return <span className="text-blue-400 font-bold text-xs shrink-0">⚡</span>;
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) return <span className="text-yellow-400 font-bold text-xs shrink-0">JS</span>;
    if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return <span className="text-blue-400 font-bold text-xs shrink-0">TS</span>;
    if (lower.endsWith('.java')) return <span className="text-orange-400 font-bold text-xs shrink-0">☕</span>;
    if (lower.endsWith('.json')) return <span className="text-emerald-400 font-mono text-[10px] shrink-0">{}</span>;
    if (lower.endsWith('.md')) return <span className="text-slate-300 font-bold text-xs shrink-0">M↓</span>;
    return <File className="w-4 h-4 text-content-muted shrink-0" />;
  };

  // Sort files: directories first, then alphabetically
  const sortedFiles = [...files].sort((a, b) => {
    if (a.is_directory === b.is_directory) {
      return a.name.localeCompare(b.name);
    }
    return a.is_directory ? -1 : 1;
  });

  return (
    <div className="h-full flex flex-col bg-background-panel border-r border-border-subtle select-none">
      {/* File Explorer Header Toolbar */}
      <div className="px-3 py-2.5 border-b border-border-subtle flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-content-secondary font-mono">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setIsCreatingFile(true);
              setIsCreatingFolder(false);
              setNewItemName('');
            }}
            title="New File"
            className="p-1 rounded text-content-muted hover:text-content-main hover:bg-background-hover transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsCreatingFolder(true);
              setIsCreatingFile(false);
              setNewItemName('');
            }}
            title="New Folder"
            className="p-1 rounded text-content-muted hover:text-content-main hover:bg-background-hover transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRefresh}
            title="Refresh Files"
            className="p-1 rounded text-content-muted hover:text-content-main hover:bg-background-hover transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Create Input */}
      {(isCreatingFile || isCreatingFolder) && (
        <div className="px-3 py-2 border-b border-border-subtle bg-background-secondary/50">
          <div className="flex items-center gap-1.5">
            {isCreatingFolder ? (
              <Folder className="w-4 h-4 text-accent-secondary shrink-0" />
            ) : (
              <File className="w-4 h-4 text-accent-primary shrink-0" />
            )}
            <input
              type="text"
              placeholder={isCreatingFolder ? 'folder name...' : 'filename.ext...'}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateItem(isCreatingFolder);
                if (e.key === 'Escape') {
                  setIsCreatingFile(false);
                  setIsCreatingFolder(false);
                }
              }}
              autoFocus
              className="flex-1 bg-background-secondary border border-accent-primary rounded px-2 py-0.5 text-xs text-content-main outline-none font-mono"
            />
            <button
              onClick={() => handleCreateItem(isCreatingFolder)}
              className="text-emerald-400 hover:text-emerald-300 p-0.5"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsCreatingFile(false);
                setIsCreatingFolder(false);
              }}
              className="text-rose-400 hover:text-rose-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Files Tree List */}
      <div className="flex-1 overflow-y-auto py-1">
        {sortedFiles.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-content-muted">
            No files in workspace. Click + to create one.
          </div>
        ) : (
          sortedFiles.map((file) => {
            const isExpanded = !!expandedFolders[file.path];
            const isActive = activeFileId === file.id;

            return (
              <div
                key={file.id}
                onClick={() => {
                  if (file.is_directory) {
                    toggleFolder(file.path);
                  } else {
                    openFile(file);
                  }
                }}
                className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs font-mono transition-colors ${
                  isActive
                    ? 'bg-accent-primary/15 text-white font-medium border-l-2 border-accent-primary'
                    : 'text-content-secondary hover:text-content-main hover:bg-background-hover'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {file.is_directory && (
                    <span className="text-content-muted">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </span>
                  )}
                  {getFileIcon(file.name, file.is_directory, isExpanded)}
                  <span className="truncate">{file.name}</span>
                </div>

                {/* File Action Controls on Hover */}
                <div className="hidden group-hover:flex items-center gap-1 opacity-80 hover:opacity-100">
                  <button
                    onClick={(e) => handleDelete(file, e)}
                    title="Delete"
                    className="p-1 rounded text-content-muted hover:text-rose-400 hover:bg-background-panel"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Plus, X, Edit2, Check } from 'lucide-react';
import { Watchlist } from '@/types';

interface WatchlistTabsProps {
  watchlists: Watchlist[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function WatchlistTabs({
  watchlists,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: WatchlistTabsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  const startEditing = (watchlist: Watchlist) => {
    setEditingId(watchlist.id);
    setEditName(watchlist.name);
  };

  return (
    <div className="flex items-end border-b border-sheet-border bg-sheet-header">
      {/* Tabs */}
      <div className="flex overflow-x-auto">
        {watchlists.map((watchlist) => {
          const isActive = watchlist.id === activeId;
          const isEditing = editingId === watchlist.id;

          return (
            <div
              key={watchlist.id}
              className={`tab group flex items-center gap-1 px-4 py-2 cursor-pointer border-r border-sheet-border transition-colors ${
                isActive
                  ? 'bg-sheet-bg text-sheet-text border-t-2 border-t-blue-500'
                  : 'bg-sheet-tab text-sheet-text-muted hover:bg-sheet-row hover:text-sheet-text'
              }`}
              onClick={() => !isEditing && onSelect(watchlist.id)}
            >
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(watchlist.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="w-24 px-1 py-0.5 text-sm bg-sheet-bg border border-sheet-border rounded focus:outline-none focus:border-blue-500"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(watchlist.id);
                    }}
                    className="p-0.5 hover:text-emerald-400"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {watchlist.name}
                  </span>
                  <span className="text-xs text-sheet-text-muted ml-1">
                    ({watchlist.symbols.length})
                  </span>
                  
                  {/* Edit/Delete buttons - show on hover */}
                  <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(watchlist);
                      }}
                      className="p-0.5 hover:text-blue-400"
                      title="Rename"
                    >
                      <Edit2 size={12} />
                    </button>
                    {watchlist.id !== 'default' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${watchlist.name}"?`)) {
                            onDelete(watchlist.id);
                          }
                        }}
                        className="p-0.5 hover:text-red-400"
                        title="Delete"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* New Tab Button */}
      {isCreating ? (
        <div className="flex items-center gap-1 px-3 py-2 border-r border-sheet-border bg-sheet-tab">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewName('');
              }
            }}
            placeholder="Watchlist name"
            className="w-28 px-2 py-1 text-sm bg-sheet-bg border border-sheet-border rounded focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={handleCreate}
            className="p-1 hover:text-emerald-400"
            title="Create"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => {
              setIsCreating(false);
              setNewName('');
            }}
            className="p-1 hover:text-red-400"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 px-3 py-2 text-sheet-text-muted hover:text-sheet-text hover:bg-sheet-row transition-colors"
          title="New watchlist"
        >
          <Plus size={16} />
        </button>
      )}
    </div>
  );
}


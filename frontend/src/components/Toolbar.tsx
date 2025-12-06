'use client';

import React from 'react';
import { Plus, BarChart3, LogOut } from 'lucide-react';
import ConnectionStatus from './ConnectionStatus';
import { authApi } from '@/lib/api';

interface ToolbarProps {
  isConnected: boolean;
  error: string | null;
  onReconnect: () => void;
  onAddSymbol: () => void;
  stockCount: number;
}

export default function Toolbar({
  isConnected,
  error,
  onReconnect,
  onAddSymbol,
  stockCount,
}: ToolbarProps) {
  const handleLogout = async () => {
    await authApi.logout();
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-sheet-header border-b border-sheet-border">
      {/* Left side - Logo and title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-blue-400">
          <BarChart3 size={24} />
          <span className="text-lg font-bold">Trading Watchlist</span>
        </div>
        <span className="text-xs text-sheet-text-muted">
          {stockCount} symbol{stockCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Right side - Actions and status */}
      <div className="flex items-center gap-4">
        <button
          onClick={onAddSymbol}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
        >
          <Plus size={16} />
          Add Symbol
        </button>

        <div className="h-6 w-px bg-sheet-border" />

        <ConnectionStatus
          isConnected={isConnected}
          error={error}
          onReconnect={onReconnect}
        />

        <div className="h-6 w-px bg-sheet-border" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sheet-text-muted hover:text-sheet-text hover:bg-sheet-row text-sm rounded transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}

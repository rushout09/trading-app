'use client';

import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
  onReconnect: () => void;
}

export default function ConnectionStatus({
  isConnected,
  error,
  onReconnect,
}: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Wifi size={16} />
            <span className="text-xs font-medium">Live</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 live-indicator" />
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5 text-red-400">
            <WifiOff size={16} />
            <span className="text-xs font-medium">
              {error || 'Disconnected'}
            </span>
          </div>
          <button
            onClick={onReconnect}
            className="p-1 text-sheet-text-muted hover:text-sheet-text transition-colors"
            title="Reconnect"
          >
            <RefreshCw size={14} />
          </button>
        </>
      )}
    </div>
  );
}


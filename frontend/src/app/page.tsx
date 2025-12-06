'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { authApi, watchlistApi } from '@/lib/api';
import { Watchlist, StockData } from '@/types';
import WatchlistTabs from '@/components/WatchlistTabs';
import SpreadsheetTable from '@/components/SpreadsheetTable';
import AddSymbolModal from '@/components/AddSymbolModal';
import Toolbar from '@/components/Toolbar';
import LoginPage from '@/components/LoginPage';

export default function Home() {
  const searchParams = useSearchParams();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // App state
  const { stockData, watchlists: wsWatchlists, isConnected, error, reconnect } = useWebSocket();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>('default');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check for login callback params
      const loginStatus = searchParams.get('login');
      const errorMessage = searchParams.get('message');
      
      if (loginStatus === 'error' && errorMessage) {
        setLoginError(decodeURIComponent(errorMessage));
      }
      
      // Clear URL params
      if (loginStatus) {
        window.history.replaceState({}, '', '/');
      }
      
      // Check auth status from backend
      const response = await authApi.getStatus();
      if (response.data) {
        setIsAuthenticated(response.data.authenticated);
        if (!response.data.authenticated && loginStatus === 'success') {
          // Login was successful but we're not authenticated yet - refresh
          window.location.reload();
        }
      } else {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [searchParams]);

  // Sync watchlists from WebSocket
  useEffect(() => {
    if (wsWatchlists.length > 0) {
      setWatchlists(wsWatchlists);
    }
  }, [wsWatchlists]);

  // Fetch watchlists on mount (when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchWatchlists = async () => {
      const response = await watchlistApi.getAll();
      if (response.data?.watchlists) {
        setWatchlists(response.data.watchlists);
      }
    };
    fetchWatchlists();
  }, [isAuthenticated]);

  // Get active watchlist
  const activeWatchlist = useMemo(() => {
    return watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];
  }, [watchlists, activeWatchlistId]);

  // Get stocks for active watchlist with real-time data
  const activeStocks: StockData[] = useMemo(() => {
    if (!activeWatchlist) return [];

    return activeWatchlist.symbols.map((item) => {
      const key = `${item.exchange}:${item.symbol}`;
      const data = stockData.get(key);

      if (data) {
        return data;
      }

      // Return placeholder if no data yet
      return {
        symbol: item.symbol,
        exchange: item.exchange,
        cmp: null,
        w52_high: null,
        w52_low: null,
        dfl: null,
        dfh: null,
        day_low: null,
        day_high: null,
        dfdl: null,
        dfdh: null,
        buyers: null,
        sellers: null,
        bsr: null,
      };
    });
  }, [activeWatchlist, stockData]);

  // Get existing symbols for the active watchlist
  const existingSymbols = useMemo(() => {
    if (!activeWatchlist) return new Set<string>();
    return new Set(
      activeWatchlist.symbols.map((s) => `${s.exchange}:${s.symbol}`)
    );
  }, [activeWatchlist]);

  // Handlers
  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    setLoginError(null);
  }, []);

  const handleCreateWatchlist = useCallback(async (name: string) => {
    const response = await watchlistApi.create(name);
    if (response.data?.watchlist) {
      setWatchlists((prev) => [...prev, response.data!.watchlist]);
      setActiveWatchlistId(response.data.watchlist.id);
    }
  }, []);

  const handleRenameWatchlist = useCallback(async (id: string, name: string) => {
    const response = await watchlistApi.update(id, name);
    if (response.data?.watchlist) {
      setWatchlists((prev) =>
        prev.map((w) => (w.id === id ? response.data!.watchlist : w))
      );
    }
  }, []);

  const handleDeleteWatchlist = useCallback(async (id: string) => {
    const response = await watchlistApi.delete(id);
    if (!response.error) {
      setWatchlists((prev) => prev.filter((w) => w.id !== id));
      if (activeWatchlistId === id) {
        setActiveWatchlistId('default');
      }
    }
  }, [activeWatchlistId]);

  const handleAddSymbol = useCallback(async (symbol: string, exchange: string) => {
    if (!activeWatchlist) return;

    const response = await watchlistApi.addSymbol(activeWatchlist.id, symbol, exchange);
    if (response.data?.watchlist) {
      setWatchlists((prev) =>
        prev.map((w) => (w.id === activeWatchlist.id ? response.data!.watchlist : w))
      );
    }
  }, [activeWatchlist]);

  const handleRemoveSymbol = useCallback(async (symbol: string, exchange: string) => {
    if (!activeWatchlist) return;

    const response = await watchlistApi.removeSymbol(activeWatchlist.id, symbol, exchange);
    if (response.data?.watchlist) {
      setWatchlists((prev) =>
        prev.map((w) => (w.id === activeWatchlist.id ? response.data!.watchlist : w))
      );
    }
  }, [activeWatchlist]);

  // Count total symbols across all watchlists
  const totalSymbols = useMemo(() => {
    return watchlists.reduce((acc, w) => acc + w.symbols.length, 0);
  }, [watchlists]);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sheet-bg">
        <div className="text-sheet-text-muted">Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess}
        loginError={loginError}
      />
    );
  }

  // Main app
  return (
    <div className="min-h-screen flex flex-col bg-sheet-bg">
      {/* Toolbar */}
      <Toolbar
        isConnected={isConnected}
        error={error}
        onReconnect={reconnect}
        onAddSymbol={() => setIsAddModalOpen(true)}
        stockCount={totalSymbols}
      />

      {/* Watchlist Tabs */}
      <WatchlistTabs
        watchlists={watchlists}
        activeId={activeWatchlistId}
        onSelect={setActiveWatchlistId}
        onCreate={handleCreateWatchlist}
        onRename={handleRenameWatchlist}
        onDelete={handleDeleteWatchlist}
      />

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto">
        <SpreadsheetTable
          stocks={activeStocks}
          onRemoveSymbol={handleRemoveSymbol}
        />
      </div>

      {/* Formula Bar / Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-sheet-header border-t border-sheet-border text-xs text-sheet-text-muted">
        <div>
          {activeWatchlist && (
            <span>
              Watchlist: <span className="text-sheet-text">{activeWatchlist.name}</span>
              {' • '}
              {activeWatchlist.symbols.length} symbol{activeWatchlist.symbols.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>
            DFL = (CMP - 52W Low) / CMP
          </span>
          <span>
            DFH = (52W High - CMP) / CMP
          </span>
          <span>
            BSR = Buyers / Sellers
          </span>
        </div>
      </div>

      {/* Add Symbol Modal */}
      <AddSymbolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSymbol}
        existingSymbols={existingSymbols}
      />
    </div>
  );
}

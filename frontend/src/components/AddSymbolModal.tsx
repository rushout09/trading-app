'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { stockApi } from '@/lib/api';

interface AddSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (symbol: string, exchange: string) => void;
  existingSymbols: Set<string>;
}

interface SearchResult {
  symbol: string;
  exchange: string;
  name: string;
}

export default function AddSymbolModal({
  isOpen,
  onClose,
  onAdd,
  existingSymbols,
}: AddSymbolModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualExchange, setManualExchange] = useState('NSE');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const searchStocks = async () => {
      if (query.length < 1) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const response = await stockApi.search(query);
      setIsLoading(false);

      if (response.data?.results) {
        setResults(response.data.results);
      }
    };

    const debounce = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleAdd = (symbol: string, exchange: string) => {
    const key = `${exchange}:${symbol}`;
    if (!existingSymbols.has(key)) {
      onAdd(symbol, exchange);
    }
  };

  const handleManualAdd = () => {
    if (manualSymbol.trim()) {
      handleAdd(manualSymbol.trim().toUpperCase(), manualExchange);
      setManualSymbol('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-sheet-bg border border-sheet-border rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sheet-border">
          <h2 className="text-lg font-semibold text-sheet-text">Add Symbol</h2>
          <button
            onClick={onClose}
            className="p-1 text-sheet-text-muted hover:text-sheet-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sheet-text-muted"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stocks..."
              className="w-full pl-10 pr-4 py-2 bg-sheet-row border border-sheet-border rounded-lg text-sheet-text placeholder:text-sheet-text-muted focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Search Results */}
          <div className="mt-3 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="py-4 text-center text-sheet-text-muted">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((result) => {
                  const key = `${result.exchange}:${result.symbol}`;
                  const isAdded = existingSymbols.has(key);

                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        isAdded
                          ? 'bg-sheet-row-alt opacity-50'
                          : 'bg-sheet-row hover:bg-sheet-header cursor-pointer'
                      }`}
                      onClick={() => !isAdded && handleAdd(result.symbol, result.exchange)}
                    >
                      <div>
                        <div className="font-semibold text-blue-400">
                          {result.symbol}
                        </div>
                        <div className="text-xs text-sheet-text-muted">
                          {result.exchange} • {result.name}
                        </div>
                      </div>
                      {isAdded ? (
                        <span className="text-xs text-sheet-text-muted">Added</span>
                      ) : (
                        <Plus size={18} className="text-sheet-text-muted" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : query.length > 0 ? (
              <div className="py-4 text-center text-sheet-text-muted">
                No results found
              </div>
            ) : null}
          </div>

          {/* Manual Add */}
          <div className="mt-4 pt-4 border-t border-sheet-border">
            <p className="text-sm text-sheet-text-muted mb-2">
              Or add manually:
            </p>
            <div className="flex gap-2">
              <select
                value={manualExchange}
                onChange={(e) => setManualExchange(e.target.value)}
                className="px-3 py-2 bg-sheet-row border border-sheet-border rounded-lg text-sheet-text focus:outline-none focus:border-blue-500"
              >
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
                <option value="NFO">NFO</option>
                <option value="MCX">MCX</option>
              </select>
              <input
                type="text"
                value={manualSymbol}
                onChange={(e) => setManualSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualAdd();
                }}
                placeholder="Symbol (e.g., RELIANCE)"
                className="flex-1 px-3 py-2 bg-sheet-row border border-sheet-border rounded-lg text-sheet-text placeholder:text-sheet-text-muted focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleManualAdd}
                disabled={!manualSymbol.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-sheet-row disabled:text-sheet-text-muted text-white rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


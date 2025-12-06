'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { StockData, SortConfig, ColumnDefinition, ColumnKey } from '@/types';

interface SpreadsheetTableProps {
  stocks: StockData[];
  onRemoveSymbol: (symbol: string, exchange: string) => void;
}

const formatNumber = (value: number | null, decimals: number = 2): string => {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatPercent = (value: number | null): string => {
  if (value === null || value === undefined) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const formatQuantity = (value: number | null): string => {
  if (value === null || value === undefined) return '—';
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toString();
};

const columns: ColumnDefinition[] = [
  { key: 'symbol', label: 'Symbol', width: '100px', align: 'left' },
  { key: 'cmp', label: 'CMP', width: '90px', align: 'right', format: (v) => formatNumber(v) },
  { key: 'w52_high', label: '52W High', width: '90px', align: 'right', format: (v) => formatNumber(v) },
  { key: 'w52_low', label: '52W Low', width: '90px', align: 'right', format: (v) => formatNumber(v) },
  { key: 'dfl', label: 'DFL%', width: '75px', align: 'right', format: (v) => formatPercent(v), colorize: true },
  { key: 'dfh', label: 'DFH%', width: '75px', align: 'right', format: (v) => formatPercent(v), colorize: true },
  { key: 'day_low', label: 'Day Low', width: '85px', align: 'right', format: (v) => formatNumber(v) },
  { key: 'day_high', label: 'Day High', width: '85px', align: 'right', format: (v) => formatNumber(v) },
  { key: 'dfdl', label: 'DFDL%', width: '75px', align: 'right', format: (v) => formatPercent(v), colorize: true },
  { key: 'dfdh', label: 'DFDH%', width: '75px', align: 'right', format: (v) => formatPercent(v), colorize: true },
  { key: 'buyers', label: 'Buyers', width: '80px', align: 'right', format: (v) => formatQuantity(v) },
  { key: 'sellers', label: 'Sellers', width: '80px', align: 'right', format: (v) => formatQuantity(v) },
  { key: 'bsr', label: 'BSR', width: '65px', align: 'right', format: (v) => formatNumber(v), colorize: true },
];

export default function SpreadsheetTable({ stocks, onRemoveSymbol }: SpreadsheetTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: null });
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSort = (column: ColumnKey) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        // Cycle: asc -> desc -> null
        if (prev.direction === 'asc') return { column, direction: 'desc' };
        if (prev.direction === 'desc') return { column: null, direction: null };
      }
      return { column, direction: 'asc' };
    });
  };

  const sortedStocks = useMemo(() => {
    if (!sortConfig.column || !sortConfig.direction) return stocks;

    return [...stocks].sort((a, b) => {
      const aVal = a[sortConfig.column!];
      const bVal = b[sortConfig.column!];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [stocks, sortConfig]);

  const getCellColor = (column: ColumnDefinition, value: number | null): string => {
    if (!column.colorize || value === null) return '';
    
    // For BSR: > 1 is positive (more buyers), < 1 is negative
    if (column.key === 'bsr') {
      if (value > 1) return 'text-emerald-400';
      if (value < 1) return 'text-red-400';
      return '';
    }
    
    // For percentage columns: positive is green, negative is red
    if (value > 0) return 'text-emerald-400';
    if (value < 0) return 'text-red-400';
    return '';
  };

  if (stocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sheet-text-muted">
        <div className="text-center">
          <p className="text-lg mb-2">No stocks in this watchlist</p>
          <p className="text-sm">Click "Add Symbol" to add stocks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {/* Header */}
        <thead>
          <tr className="bg-sheet-header border-b border-sheet-border">
            {/* Row number column */}
            <th className="w-10 px-2 py-2 text-center text-sheet-text-muted font-medium border-r border-sheet-border">
              #
            </th>
            
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 font-medium text-sheet-text border-r border-sheet-border cursor-pointer hover:bg-sheet-row transition-colors select-none"
                style={{ width: col.width, textAlign: col.align }}
                onClick={() => handleSort(col.key)}
              >
                <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                  <span>{col.label}</span>
                  <div className="flex flex-col -space-y-1">
                    <ChevronUp
                      size={12}
                      className={`sort-indicator ${sortConfig.column === col.key && sortConfig.direction === 'asc' ? 'active text-blue-400' : ''}`}
                    />
                    <ChevronDown
                      size={12}
                      className={`sort-indicator ${sortConfig.column === col.key && sortConfig.direction === 'desc' ? 'active text-blue-400' : ''}`}
                    />
                  </div>
                </div>
              </th>
            ))}
            
            {/* Actions column */}
            <th className="w-10 px-2 py-2 text-center text-sheet-text-muted font-medium">
              
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {sortedStocks.map((stock, index) => {
            const rowKey = `${stock.exchange}:${stock.symbol}`;
            const isHovered = hoveredRow === rowKey;
            
            return (
              <tr
                key={rowKey}
                className={`border-b border-sheet-border transition-colors ${
                  index % 2 === 0 ? 'bg-sheet-row' : 'bg-sheet-row-alt'
                } ${isHovered ? 'bg-sheet-header' : ''}`}
                onMouseEnter={() => setHoveredRow(rowKey)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Row number */}
                <td className="px-2 py-2 text-center text-sheet-text-muted border-r border-sheet-border">
                  {index + 1}
                </td>
                
                {columns.map((col) => {
                  const value = stock[col.key];
                  const displayValue = col.format && typeof value === 'number'
                    ? col.format(value)
                    : (value ?? '—');
                  const colorClass = getCellColor(col, typeof value === 'number' ? value : null);
                  
                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-2 border-r border-sheet-border font-mono ${colorClass}`}
                      style={{ textAlign: col.align }}
                    >
                      {col.key === 'symbol' ? (
                        <span className="font-semibold text-blue-400">{displayValue}</span>
                      ) : (
                        displayValue
                      )}
                    </td>
                  );
                })}
                
                {/* Delete button */}
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => onRemoveSymbol(stock.symbol, stock.exchange)}
                    className="p-1 text-sheet-text-muted hover:text-red-400 transition-colors opacity-0 hover:opacity-100"
                    style={{ opacity: isHovered ? 1 : 0 }}
                    title="Remove from watchlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


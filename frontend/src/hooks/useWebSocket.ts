'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { StockData, Watchlist, WebSocketMessage } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

interface UseWebSocketReturn {
  stockData: Map<string, StockData>;
  watchlists: Watchlist[];
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [stockData, setStockData] = useState<Map<string, StockData>>(new Map());
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle authentication error
          if (message.type === 'error' && message.code === 'AUTH_REQUIRED') {
            setError('Authentication required');
            shouldReconnectRef.current = false;
            ws.close();
            return;
          }

          if (message.type === 'initial_data') {
            // Set initial watchlists
            if (message.watchlists) {
              setWatchlists(message.watchlists);
            }
            
            // Set initial stock data
            if (message.data) {
              const newData = new Map<string, StockData>();
              message.data.forEach((stock: StockData) => {
                const key = `${stock.exchange}:${stock.symbol}`;
                newData.set(key, stock);
              });
              setStockData(newData);
            }
          } else if (message.type === 'tick_update') {
            // Update stock data
            if (message.data) {
              setStockData((prev) => {
                const updated = new Map(prev);
                message.data.forEach((stock: StockData) => {
                  const key = `${stock.exchange}:${stock.symbol}`;
                  updated.set(key, stock);
                });
                return updated;
              });
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt to reconnect after 3 seconds (only if we should)
        if (shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
      };

    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      setError('Failed to connect');
    }
  }, []);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [connect]);

  return {
    stockData,
    watchlists,
    isConnected,
    error,
    reconnect,
  };
}

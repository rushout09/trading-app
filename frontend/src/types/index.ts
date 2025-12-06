export interface StockData {
  symbol: string;
  exchange: string;
  token?: number;
  cmp: number | null;
  w52_high: number | null;
  w52_low: number | null;
  dfl: number | null;      // Distance from 52W Low: (CMP - Low) / CMP * 100
  dfh: number | null;      // Distance from 52W High: (High - CMP) / CMP * 100
  day_low: number | null;
  day_high: number | null;
  dfdl: number | null;     // Distance from Day Low: (CMP - DL) / DL * 100
  dfdh: number | null;     // Distance from Day High: (DH - CMP) / CMP * 100
  buyers: number | null;
  sellers: number | null;
  bsr: number | null;      // Buy-Sell Ratio
  change?: number | null;
  volume?: number | null;
  last_trade_time?: string | null;
}

export interface SymbolEntry {
  symbol: string;
  exchange: string;
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: SymbolEntry[];
}

export interface WebSocketMessage {
  type: 'initial_data' | 'tick_update' | 'heartbeat' | 'pong';
  data?: StockData[];
  watchlists?: Watchlist[];
  timestamp?: string;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  column: keyof StockData | null;
  direction: SortDirection;
}

export type ColumnKey = keyof StockData;

export interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  width: string;
  align: 'left' | 'right';
  format?: (value: number | null) => string;
  colorize?: boolean;
}


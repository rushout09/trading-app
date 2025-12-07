const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return { error: error.detail || 'Request failed' };
    }

    const data = await response.json();
    return { data };
  } catch (e) {
    return { error: 'Network error' };
  }
}

// Auth APIs
export const authApi = {
  getStatus: () => 
    fetchApi<{ authenticated: boolean; api_key_configured: boolean }>('/api/auth/status'),
  
  getLoginUrl: () => 
    fetchApi<{ login_url: string }>('/api/auth/login-url'),
  
  logout: () =>
    fetchApi<{ status: string }>('/api/auth/logout', { method: 'POST' }),
};

// Watchlist APIs
export const watchlistApi = {
  getAll: () => fetchApi<{ watchlists: any[] }>('/api/watchlists'),
  
  create: (name: string) =>
    fetchApi<{ watchlist: any }>('/api/watchlists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  
  update: (id: string, name: string) =>
    fetchApi<{ watchlist: any }>(`/api/watchlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
  
  delete: (id: string) =>
    fetchApi<{ status: string }>(`/api/watchlists/${id}`, {
      method: 'DELETE',
    }),
  
  addSymbol: (watchlistId: string, symbol: string, exchange: string = 'NSE') =>
    fetchApi<{ watchlist: any }>(`/api/watchlists/${watchlistId}/symbols`, {
      method: 'POST',
      body: JSON.stringify({ symbol, exchange }),
    }),
  
  removeSymbol: (watchlistId: string, symbol: string, exchange: string = 'NSE') =>
    fetchApi<{ watchlist: any }>(
      `/api/watchlists/${watchlistId}/symbols?symbol=${symbol}&exchange=${exchange}`,
      { method: 'DELETE' }
    ),
};

// Stock APIs
export const stockApi = {
  search: (query: string, options?: { exchange?: string; segment?: string }) => {
    const params = new URLSearchParams({ q: query });
    if (options?.exchange) params.append('exchange', options.exchange);
    if (options?.segment) params.append('segment', options.segment);
    return fetchApi<{ results: any[] }>(`/api/stocks/search?${params.toString()}`);
  },
  
  getStock: (exchange: string, symbol: string) =>
    fetchApi<{ stock: any }>(`/api/stocks/${exchange}/${symbol}`),
};

// Health check
export const healthApi = {
  check: () => fetchApi<any>('/api/health'),
};

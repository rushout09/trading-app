'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
  loginError?: string | null;
}

export default function LoginPage({ onLoginSuccess, loginError }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(loginError || null);

  useEffect(() => {
    if (loginError) {
      setError(loginError);
    }
  }, [loginError]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.getLoginUrl();
      
      if (response.error) {
        setError(response.error);
        setIsLoading(false);
        return;
      }

      if (response.data?.login_url) {
        // Redirect to Kite login
        window.location.href = response.data.login_url;
      }
    } catch (e) {
      setError('Failed to get login URL');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sheet-bg">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-5">
          {/* Grid pattern */}
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-sheet-header border border-sheet-border rounded-2xl p-8 shadow-2xl">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <BarChart3 size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-sheet-text mb-2">
              Trading Watchlist
            </h1>
            <p className="text-sheet-text-muted text-sm">
              Real-time stock monitoring with Excel-like interface
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">Login Failed</p>
                <p className="text-red-400/70 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Login with Kite</span>
              </>
            )}
          </button>

          {/* Info */}
          <p className="text-center text-sheet-text-muted text-xs mt-6">
            You will be redirected to Zerodha Kite for authentication
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-blue-400 text-2xl font-bold mb-1">Real-time</div>
            <div className="text-sheet-text-muted text-xs">Live price updates</div>
          </div>
          <div className="p-4">
            <div className="text-emerald-400 text-2xl font-bold mb-1">Multi-list</div>
            <div className="text-sheet-text-muted text-xs">Multiple watchlists</div>
          </div>
          <div className="p-4">
            <div className="text-purple-400 text-2xl font-bold mb-1">Analytics</div>
            <div className="text-sheet-text-muted text-xs">52W & Day metrics</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center text-sheet-text-muted text-xs">
        <p>Powered by Kite Connect API</p>
      </div>
    </div>
  );
}


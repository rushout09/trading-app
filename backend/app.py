"""
FastAPI Backend for Trading App with WebSocket Real-time Data Streaming
"""

import os
import json
import asyncio
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from dotenv import load_dotenv, set_key
import httpx

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Kite Connect imports
from kiteconnect import KiteConnect, KiteTicker

# Environment variables
KITE_API_KEY = os.getenv("KITE_API_KEY")
KITE_API_SECRET = os.getenv("KITE_API_SECRET")
ENV_FILE = os.path.join(os.path.dirname(__file__), "..", ".env")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Data storage file
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
WATCHLISTS_FILE = os.path.join(DATA_DIR, "watchlists.json")


# ============== Pydantic Models ==============

class WatchlistCreate(BaseModel):
    name: str

class WatchlistUpdate(BaseModel):
    name: Optional[str] = None

class AddSymbolRequest(BaseModel):
    symbol: str
    exchange: str = "NSE"

class RemoveSymbolRequest(BaseModel):
    symbol: str
    exchange: str = "NSE"


# ============== JSON File Storage ==============

def ensure_data_dir():
    """Ensure the data directory exists."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        log.info(f"Created data directory: {DATA_DIR}")


def load_watchlists() -> Dict[str, Dict]:
    """Load watchlists from JSON file."""
    ensure_data_dir()
    
    if not os.path.exists(WATCHLISTS_FILE):
        # Return default watchlist if file doesn't exist
        default_data = {
            "default": {
                "id": "default",
                "name": "My Watchlist",
                "symbols": []
            }
        }
        save_watchlists(default_data)
        return default_data
    
    try:
        with open(WATCHLISTS_FILE, 'r') as f:
            data = json.load(f)
            log.info(f"Loaded {len(data)} watchlists from {WATCHLISTS_FILE}")
            return data
    except Exception as e:
        log.error(f"Error loading watchlists: {e}")
        return {
            "default": {
                "id": "default",
                "name": "My Watchlist",
                "symbols": []
            }
        }


def save_watchlists(data: Dict[str, Dict]) -> bool:
    """Save watchlists to JSON file."""
    ensure_data_dir()
    
    try:
        with open(WATCHLISTS_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        log.info(f"Saved {len(data)} watchlists to {WATCHLISTS_FILE}")
        return True
    except Exception as e:
        log.error(f"Error saving watchlists: {e}")
        return False


# Load watchlists on startup
watchlists: Dict[str, Dict] = load_watchlists()

# Cache for instrument data
instruments_cache: Dict[str, dict] = {}
week_52_cache: Dict[int, dict] = {}  # {token: {"high": x, "low": y, "fetched_at": datetime}}


# ============== Kite Connect Manager ==============

class KiteManager:
    """Manages Kite Connect API and WebSocket connections."""
    
    def __init__(self):
        self.api_key = KITE_API_KEY
        self.api_secret = KITE_API_SECRET
        self.access_token: Optional[str] = os.getenv("KITE_ACCESS_TOKEN")
        self.kite: Optional[KiteConnect] = None
        self.ticker: Optional[KiteTicker] = None
        self.is_connected = False
        self.subscribed_tokens: Set[int] = set()
        self.latest_ticks: Dict[int, dict] = {}  # {token: tick_data}
        self.token_to_symbol: Dict[int, str] = {}  # {token: "NSE:SYMBOL"}
        
        self._initialize_kite()
    
    def _initialize_kite(self):
        """Initialize KiteConnect with stored access token."""
        if self.api_key and self.access_token:
            try:
                self.kite = KiteConnect(api_key=self.api_key)
                self.kite.set_access_token(self.access_token)
                # Test the connection
                self.kite.profile()
                log.info("KiteConnect initialized and authenticated")
            except Exception as e:
                log.warning(f"KiteConnect initialization failed: {e}")
                self.kite = None
                self.access_token = None
        else:
            log.warning("KiteConnect not initialized - missing credentials")
    
    def is_authenticated(self) -> bool:
        """Check if user is authenticated with valid access token."""
        return self.kite is not None and self.access_token is not None
    
    def get_login_url(self) -> str:
        """Get Kite login URL."""
        return f"https://kite.zerodha.com/connect/login?v=3&api_key={self.api_key}"
    
    def set_access_token(self, access_token: str):
        """Set access token and reinitialize Kite."""
        self.access_token = access_token
        self._initialize_kite()
        
        # Save to .env file
        try:
            set_key(ENV_FILE, "KITE_ACCESS_TOKEN", access_token)
            log.info(f"Access token saved to {ENV_FILE}")
        except Exception as e:
            log.warning(f"Could not save access token to .env: {e}")
    
    def exchange_request_token(self, request_token: str) -> dict:
        """Exchange request token for access token."""
        if not self.api_key or not self.api_secret:
            raise ValueError("API key or secret not configured")
        
        checksum = self.api_key + request_token + self.api_secret
        sha_checksum = hashlib.sha256(checksum.encode()).hexdigest()
        
        session_data = {
            'api_key': self.api_key,
            'request_token': request_token,
            'checksum': sha_checksum
        }
        headers = {"X-Kite-Version": "3"}
        
        with httpx.Client() as client:
            response = client.post(
                "https://api.kite.trade/session/token",
                headers=headers,
                data=session_data
            )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data['data']['access_token']
            self.set_access_token(access_token)
            return {"status": "success", "access_token": access_token}
        else:
            error_data = response.json()
            raise ValueError(error_data.get('message', 'Token exchange failed'))
    
    def logout(self):
        """Clear authentication state."""
        self.access_token = None
        self.kite = None
        self.latest_ticks.clear()
        instruments_cache.clear()
        week_52_cache.clear()
    
    def load_instruments(self, exchange: str = "NSE") -> None:
        """Load instruments for an exchange."""
        if not self.kite:
            raise ValueError("Not authenticated")
        
        cache_key = f"_loaded_{exchange}"
        if cache_key in instruments_cache:
            return
        
        try:
            log.info(f"Loading instruments for {exchange}...")
            instruments = self.kite.instruments(exchange)
            
            for inst in instruments:
                key = f"{exchange}:{inst['tradingsymbol']}"
                instruments_cache[key] = inst
                instruments_cache[inst['instrument_token']] = inst
            
            instruments_cache[cache_key] = True
            log.info(f"Loaded {len(instruments)} instruments for {exchange}")
        except Exception as e:
            log.error(f"Error loading instruments: {e}")
            raise
    
    def get_instrument_token(self, exchange: str, symbol: str) -> Optional[int]:
        """Get instrument token for a symbol."""
        self.load_instruments(exchange)
        key = f"{exchange}:{symbol}"
        inst = instruments_cache.get(key)
        return inst['instrument_token'] if inst else None
    
    def fetch_52_week_data(self, instrument_token: int) -> dict:
        """Fetch 52-week high/low for an instrument."""
        # Check cache (refresh if older than 1 day)
        if instrument_token in week_52_cache:
            cached = week_52_cache[instrument_token]
            if datetime.now() - cached['fetched_at'] < timedelta(days=1):
                return {"high": cached['high'], "low": cached['low']}
        
        if not self.kite:
            return {"high": None, "low": None}
        
        try:
            to_date = datetime.now()
            from_date = to_date - timedelta(days=365)
            
            historical = self.kite.historical_data(
                instrument_token=instrument_token,
                from_date=from_date,
                to_date=to_date,
                interval="day"
            )
            
            if not historical:
                return {"high": None, "low": None}
            
            highs = [candle['high'] for candle in historical]
            lows = [candle['low'] for candle in historical]
            
            result = {"high": max(highs), "low": min(lows)}
            week_52_cache[instrument_token] = {
                **result,
                "fetched_at": datetime.now()
            }
            return result
            
        except Exception as e:
            log.error(f"Error fetching historical data: {e}")
            return {"high": None, "low": None}
    
    def get_stock_data(self, exchange: str, symbol: str) -> dict:
        """Get complete stock data including 52-week high/low."""
        if not self.kite:
            raise ValueError("Not authenticated")
        
        token = self.get_instrument_token(exchange, symbol)
        if not token:
            return None
        
        week_52 = self.fetch_52_week_data(token)
        tick = self.latest_ticks.get(token, {})
        
        return self._format_stock_data(exchange, symbol, token, tick, week_52)
    
    def _format_stock_data(self, exchange: str, symbol: str, token: int, tick: dict, week_52: dict) -> dict:
        """Format stock data with all calculated fields."""
        cmp = tick.get('last_price')
        ohlc = tick.get('ohlc', {})
        day_high = ohlc.get('high')
        day_low = ohlc.get('low')
        w52_high = week_52.get('high')
        w52_low = week_52.get('low')
        buyers = tick.get('total_buy_quantity')
        sellers = tick.get('total_sell_quantity')
        
        # Calculate derived fields
        dfl = None  # Distance from 52W Low: (CMP - Low) / CMP * 100
        dfh = None  # Distance from 52W High: (High - CMP) / CMP * 100
        dfdl = None  # Distance from Day Low: (CMP - DL) / DL * 100
        dfdh = None  # Distance from Day High: (DH - CMP) / CMP * 100
        bsr = None  # Buy-Sell Ratio: Buyers / Sellers
        
        if cmp and cmp > 0:
            if w52_low is not None:
                dfl = ((cmp - w52_low) / cmp) * 100
            if w52_high is not None:
                dfh = ((w52_high - cmp) / cmp) * 100
            if day_high is not None:
                dfdh = ((day_high - cmp) / cmp) * 100
        
        if day_low and day_low > 0 and cmp:
            dfdl = ((cmp - day_low) / day_low) * 100
        
        if sellers and sellers > 0 and buyers is not None:
            bsr = buyers / sellers
        
        return {
            "symbol": symbol,
            "exchange": exchange,
            "token": token,
            "cmp": cmp,
            "w52_high": w52_high,
            "w52_low": w52_low,
            "dfl": round(dfl, 2) if dfl is not None else None,
            "dfh": round(dfh, 2) if dfh is not None else None,
            "day_low": day_low,
            "day_high": day_high,
            "dfdl": round(dfdl, 2) if dfdl is not None else None,
            "dfdh": round(dfdh, 2) if dfdh is not None else None,
            "buyers": buyers,
            "sellers": sellers,
            "bsr": round(bsr, 2) if bsr is not None else None,
            "change": tick.get('change'),
            "volume": tick.get('volume_traded'),
            "last_trade_time": str(tick.get('last_trade_time', '')) if tick.get('last_trade_time') else None,
        }


# Global Kite Manager instance
kite_manager = KiteManager()


# ============== WebSocket Connection Manager ==============

class ConnectionManager:
    """Manages WebSocket connections from frontend clients."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.client_subscriptions: Dict[WebSocket, Set[int]] = {}
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.client_subscriptions[websocket] = set()
        log.info(f"Client connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.client_subscriptions:
            del self.client_subscriptions[websocket]
        log.info(f"Client disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast(self, data: dict):
        """Broadcast data to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_to_client(self, websocket: WebSocket, data: dict):
        """Send data to a specific client."""
        try:
            await websocket.send_json(data)
        except Exception:
            self.disconnect(websocket)


manager = ConnectionManager()


# ============== Background Task for Real-time Updates ==============

async def broadcast_updates():
    """Background task to broadcast updates to all connected clients."""
    while True:
        try:
            if manager.active_connections and kite_manager.is_authenticated():
                # Collect all symbols from all watchlists
                all_symbols = set()
                for wl in watchlists.values():
                    for item in wl.get("symbols", []):
                        all_symbols.add((item["exchange"], item["symbol"]))
                
                if all_symbols:
                    updates = []
                    for exchange, symbol in all_symbols:
                        try:
                            data = kite_manager.get_stock_data(exchange, symbol)
                            if data:
                                updates.append(data)
                        except Exception as e:
                            log.error(f"Error getting stock data for {exchange}:{symbol}: {e}")
                    
                    if updates:
                        await manager.broadcast({
                            "type": "tick_update",
                            "data": updates,
                            "timestamp": datetime.now().isoformat()
                        })
            
            await asyncio.sleep(1)  # Update every second
            
        except Exception as e:
            log.error(f"Error in broadcast_updates: {e}")
            await asyncio.sleep(1)


# ============== FastAPI App ==============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    # Startup
    log.info("Starting background update task...")
    task = asyncio.create_task(broadcast_updates())
    yield
    # Shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Trading App API",
    description="Real-time stock data streaming with watchlist management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Authentication Endpoints ==============

@app.get("/api/auth/status")
async def auth_status():
    """Check authentication status."""
    return {
        "authenticated": kite_manager.is_authenticated(),
        "api_key_configured": bool(KITE_API_KEY),
    }


@app.get("/api/auth/login-url")
async def get_login_url():
    """Get Kite login URL."""
    if not KITE_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    return {"login_url": kite_manager.get_login_url()}


@app.get("/api/auth/callback")
async def auth_callback(request_token: str = Query(...)):
    """Handle Kite OAuth callback and exchange request token for access token."""
    try:
        result = kite_manager.exchange_request_token(request_token)
        # Redirect to frontend after successful login
        return RedirectResponse(url=f"{FRONTEND_URL}?login=success")
    except Exception as e:
        log.error(f"Auth callback error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}?login=error&message={str(e)}")


@app.post("/api/auth/logout")
async def logout():
    """Logout and clear authentication."""
    kite_manager.logout()
    return {"status": "logged_out"}


# ============== REST Endpoints ==============

@app.get("/")
async def root():
    return {"status": "ok", "message": "Trading App API"}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "authenticated": kite_manager.is_authenticated(),
        "active_connections": len(manager.active_connections),
        "watchlists_count": len(watchlists)
    }


# ----- Watchlist Endpoints -----

@app.get("/api/watchlists")
async def get_watchlists():
    """Get all watchlists."""
    return {"watchlists": list(watchlists.values())}


@app.post("/api/watchlists")
async def create_watchlist(data: WatchlistCreate):
    """Create a new watchlist."""
    import uuid
    watchlist_id = str(uuid.uuid4())[:8]
    
    watchlists[watchlist_id] = {
        "id": watchlist_id,
        "name": data.name,
        "symbols": []
    }
    
    save_watchlists(watchlists)  # Persist to file
    return {"watchlist": watchlists[watchlist_id]}


@app.get("/api/watchlists/{watchlist_id}")
async def get_watchlist(watchlist_id: str):
    """Get a specific watchlist."""
    if watchlist_id not in watchlists:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return {"watchlist": watchlists[watchlist_id]}


@app.put("/api/watchlists/{watchlist_id}")
async def update_watchlist(watchlist_id: str, data: WatchlistUpdate):
    """Update a watchlist."""
    if watchlist_id not in watchlists:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    if data.name:
        watchlists[watchlist_id]["name"] = data.name
    
    save_watchlists(watchlists)  # Persist to file
    return {"watchlist": watchlists[watchlist_id]}


@app.delete("/api/watchlists/{watchlist_id}")
async def delete_watchlist(watchlist_id: str):
    """Delete a watchlist."""
    if watchlist_id not in watchlists:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    if watchlist_id == "default":
        raise HTTPException(status_code=400, detail="Cannot delete default watchlist")
    
    del watchlists[watchlist_id]
    save_watchlists(watchlists)  # Persist to file
    return {"status": "deleted"}


@app.post("/api/watchlists/{watchlist_id}/symbols")
async def add_symbol(watchlist_id: str, data: AddSymbolRequest):
    """Add a symbol to a watchlist."""
    if watchlist_id not in watchlists:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    symbol_entry = {"symbol": data.symbol.upper(), "exchange": data.exchange.upper()}
    
    # Check if already exists
    existing = [s for s in watchlists[watchlist_id]["symbols"] 
                if s["symbol"] == symbol_entry["symbol"] and s["exchange"] == symbol_entry["exchange"]]
    
    if existing:
        raise HTTPException(status_code=400, detail="Symbol already in watchlist")
    
    watchlists[watchlist_id]["symbols"].append(symbol_entry)
    
    save_watchlists(watchlists)  # Persist to file
    return {"watchlist": watchlists[watchlist_id]}


@app.delete("/api/watchlists/{watchlist_id}/symbols")
async def remove_symbol(watchlist_id: str, symbol: str = Query(...), exchange: str = Query(default="NSE")):
    """Remove a symbol from a watchlist."""
    if watchlist_id not in watchlists:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    original_length = len(watchlists[watchlist_id]["symbols"])
    watchlists[watchlist_id]["symbols"] = [
        s for s in watchlists[watchlist_id]["symbols"]
        if not (s["symbol"] == symbol.upper() and s["exchange"] == exchange.upper())
    ]
    
    if len(watchlists[watchlist_id]["symbols"]) == original_length:
        raise HTTPException(status_code=404, detail="Symbol not found in watchlist")
    
    save_watchlists(watchlists)  # Persist to file
    return {"watchlist": watchlists[watchlist_id]}


# ----- Stock Data Endpoints -----

@app.get("/api/stocks/{exchange}/{symbol}")
async def get_stock_data(exchange: str, symbol: str):
    """Get current data for a stock."""
    if not kite_manager.is_authenticated():
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        data = kite_manager.get_stock_data(exchange.upper(), symbol.upper())
        if not data:
            raise HTTPException(status_code=404, detail="Stock not found")
        return {"stock": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stocks/search")
async def search_stocks(q: str = Query(..., min_length=1)):
    """Search for stocks by symbol."""
    if not kite_manager.is_authenticated():
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        kite_manager.load_instruments("NSE")
        
        results = []
        for key, inst in instruments_cache.items():
            if isinstance(key, str) and key.startswith("NSE:"):
                if q.upper() in inst.get('tradingsymbol', ''):
                    results.append({
                        "symbol": inst['tradingsymbol'],
                        "exchange": "NSE",
                        "name": inst.get('name', inst['tradingsymbol'])
                    })
                    if len(results) >= 10:
                        break
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== WebSocket Endpoint ==============

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data streaming."""
    await manager.connect(websocket)
    
    try:
        # Check authentication
        if not kite_manager.is_authenticated():
            await websocket.send_json({
                "type": "error",
                "message": "Not authenticated",
                "code": "AUTH_REQUIRED"
            })
            await websocket.close()
            return
        
        # Send initial data for all watchlists
        initial_data = []
        for wl in watchlists.values():
            for item in wl.get("symbols", []):
                try:
                    data = kite_manager.get_stock_data(item["exchange"], item["symbol"])
                    if data:
                        initial_data.append(data)
                except Exception as e:
                    log.error(f"Error getting initial data for {item}: {e}")
        
        await websocket.send_json({
            "type": "initial_data",
            "data": initial_data,
            "watchlists": list(watchlists.values()),
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep connection alive and handle client messages
        while True:
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                data = json.loads(message)
                
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                
                elif data.get("type") == "subscribe":
                    # Client wants to subscribe to specific symbols
                    pass
                
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({"type": "heartbeat"})
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        log.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# ============== Run Server ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

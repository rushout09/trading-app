# 📈 Trading Watchlist App

A real-time stock watchlist application with an Excel-like interface. Monitor multiple stocks across different watchlists with live price updates from Zerodha Kite.

![Tech Stack](https://img.shields.io/badge/Frontend-Next.js-black?style=flat-square&logo=next.js)
![Tech Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)
![Tech Stack](https://img.shields.io/badge/API-Kite_Connect-FF6B00?style=flat-square)

---

## ✨ Features

- **Real-time Price Updates** - Live stock data via WebSocket
- **Multiple Watchlists** - Create and manage watchlists like Excel sheets
- **Excel-like Interface** - Familiar spreadsheet-style UI
- **Column Sorting** - Sort any column ascending/descending
- **Calculated Metrics** - Automatic calculation of key indicators
- **Persistent Storage** - Watchlists saved to JSON file

---

## 📊 Data Columns

| Column | Description | Formula |
|--------|-------------|---------|
| **Symbol** | Stock symbol | User input |
| **CMP** | Current Market Price | Real-time |
| **52W High** | 52-week high price | Historical API |
| **52W Low** | 52-week low price | Historical API |
| **DFL%** | Distance from 52W Low | `(CMP - 52W Low) / CMP × 100` |
| **DFH%** | Distance from 52W High | `(52W High - CMP) / CMP × 100` |
| **Day Low** | Today's low | Real-time |
| **Day High** | Today's high | Real-time |
| **DFDL%** | Distance from Day Low | `(CMP - Day Low) / Day Low × 100` |
| **DFDH%** | Distance from Day High | `(Day High - CMP) / CMP × 100` |
| **Buyers** | Total buy quantity | Real-time |
| **Sellers** | Total sell quantity | Real-time |
| **BSR** | Buy-Sell Ratio | `Buyers / Sellers` |

---

## 🛠️ Tech Stack

### Backend
- **Python 3.10+**
- **FastAPI** - REST API & WebSocket server
- **Kite Connect** - Zerodha trading API

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide Icons** - UI icons

---

## 📁 Project Structure

```
trading-app/
├── backend/
│   ├── app.py              # FastAPI server (API + WebSocket)
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js pages
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks (WebSocket)
│   │   ├── lib/            # API client
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── tailwind.config.js
│
├── data/
│   └── watchlists.json     # Persistent watchlist storage
│
├── .env                    # Environment variables (create this)
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

1. **Python 3.10+** installed
2. **Node.js 18+** installed
3. **Kite Connect API** credentials from [Zerodha Developers](https://developers.kite.trade/)

### Step 1: Clone & Setup Environment

```bash
# Clone the repo (or navigate to your existing folder)
cd trading-app

# Create .env file in the root directory
touch .env
```

Add your Kite credentials to `.env`:

```env
KITE_API_KEY=your_api_key_here
KITE_API_SECRET=your_api_secret_here
```

### Step 2: Configure Kite Connect Redirect URL

1. Go to [Kite Connect Developer Console](https://developers.kite.trade/apps)
2. Select your app
3. Set **Redirect URL** to:
   ```
   http://localhost:8000/api/auth/callback
   ```
4. Save

### Step 3: Start Backend

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

Backend runs at: `http://localhost:8000`

### Step 4: Start Frontend

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

### Step 5: Login & Use

1. Open `http://localhost:3000` in your browser
2. Click **"Login with Kite"**
3. Complete Zerodha authentication
4. Start adding stocks to your watchlist!

---

## 🔄 How It Works

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │     │   Backend   │     │    Kite     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ Click Login       │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │ Redirect to Kite  │                   │
       │◀──────────────────│                   │
       │                   │                   │
       │───────────────────────────────────────▶
       │                   │    User logs in   │
       │                   │                   │
       │ Redirect with token                   │
       │                   │◀──────────────────│
       │                   │                   │
       │                   │ Exchange token    │
       │                   │──────────────────▶│
       │                   │◀──────────────────│
       │                   │                   │
       │ Redirect to app   │                   │
       │◀──────────────────│                   │
       │                   │                   │
       │ ✅ Authenticated  │                   │
```

### Real-time Data Flow

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Frontend  │◀══════════════════════════▶│   Backend   │
│             │    (ws://localhost:8000)   │             │
└─────────────┘                            └──────┬──────┘
                                                  │
                                                  │ REST API
                                                  ▼
                                           ┌─────────────┐
                                           │ Kite Connect│
                                           │     API     │
                                           └─────────────┘
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/status` | Check if authenticated |
| GET | `/api/auth/login-url` | Get Kite login URL |
| GET | `/api/auth/callback` | OAuth callback (automatic) |
| POST | `/api/auth/logout` | Logout |

### Watchlists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/watchlists` | Get all watchlists |
| POST | `/api/watchlists` | Create watchlist |
| PUT | `/api/watchlists/{id}` | Rename watchlist |
| DELETE | `/api/watchlists/{id}` | Delete watchlist |
| POST | `/api/watchlists/{id}/symbols` | Add symbol |
| DELETE | `/api/watchlists/{id}/symbols` | Remove symbol |

### Stocks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stocks/search?q=` | Search stocks |
| GET | `/api/stocks/{exchange}/{symbol}` | Get stock data |

### WebSocket

| URL | Description |
|-----|-------------|
| `ws://localhost:8000/ws` | Real-time stock updates |

---

## 💾 Data Storage

### Watchlists (`data/watchlists.json`)

Watchlists are stored locally in a JSON file:

```json
{
  "default": {
    "id": "default",
    "name": "My Watchlist",
    "symbols": [
      {"symbol": "RELIANCE", "exchange": "NSE"},
      {"symbol": "TCS", "exchange": "NSE"}
    ]
  }
}
```

### Access Token (`.env`)

After login, the access token is saved to `.env`:

```env
KITE_API_KEY=xxx
KITE_API_SECRET=xxx
KITE_ACCESS_TOKEN=auto_saved_after_login
```

---

## ⚠️ Important Notes

### Token Expiry
- Kite access tokens **expire daily at midnight IST**
- You'll need to re-login each trading day

### Market Hours
- Real-time data is available during market hours only
- **NSE/BSE**: 9:15 AM - 3:30 PM IST (Monday-Friday)

### API Limits
- Kite Connect has rate limits
- Historical data API: 3 requests/second
- Quote API: 1 request/second per instrument

---

## 🐛 Troubleshooting

### "Not authenticated" error
- Your access token has expired
- Click logout and login again

### WebSocket disconnects frequently
- Check your internet connection
- Backend server may have restarted

### No data showing for stocks
- Ensure it's during market hours
- Check if the symbol is correct (use search)

### "API key not configured" error
- Check your `.env` file has `KITE_API_KEY` set
- Restart the backend after updating `.env`

---

## 📝 License

This project is for personal/educational use. Make sure to comply with [Zerodha Kite Connect Terms](https://kite.trade/docs/connect/v3/).

---

## 🙏 Acknowledgments

- [Zerodha Kite Connect](https://kite.trade/) - Trading API
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework


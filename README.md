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

## ☁️ AWS EC2 Deployment

Deploy the app on AWS EC2 for access from anywhere.

### Why EC2?
- ✅ Full WebSocket support
- ✅ File system access (watchlists.json works)
- ✅ Free tier available (t2.micro)
- ✅ Simple setup

### Prerequisites
- AWS Account
- Kite Connect credentials

---

### Step 1: Launch EC2 Instance

1. Go to **AWS Console** → **EC2** → **Launch Instance**
2. Configure:

   | Setting | Value |
   |---------|-------|
   | Name | `trading-app` |
   | AMI | Ubuntu 22.04 LTS |
   | Instance type | `t2.micro` (Free tier) |
   | Key pair | Create new (download `.pem` file) |

3. **Security Group Rules**:

   | Type | Port | Source |
   |------|------|--------|
   | SSH | 22 | My IP |
   | Custom TCP | 3000 | 0.0.0.0/0 |
   | Custom TCP | 8000 | 0.0.0.0/0 |

4. **Storage**: 30 GB
5. Click **Launch Instance**

---

### Step 2: Connect to EC2

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

### Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python & Git
sudo apt install python3 python3-pip python3-venv git -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Install PM2 (process manager)
sudo npm install -g pm2

# Verify installations
python3 --version
node --version
pm2 --version
```

---

### Step 4: Install ngrok (Required for Kite HTTPS Callback)

Kite Connect requires HTTPS redirect URLs. ngrok provides a free HTTPS tunnel.

```bash
# Download ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xvzf ngrok-v3-stable-linux-amd64.tgz
mkdir -p ~/bin
mv ngrok ~/bin/
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Sign up at https://ngrok.com (free)
# Get your auth token from dashboard
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
```

---

### Step 5: Clone & Setup Project

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/trading-app.git
cd trading-app

# Setup Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Setup Frontend
cd ../frontend
npm install
```

---

### Step 6: Create Environment Files

**Get your EC2 public IP:**
```bash
curl ifconfig.me
```

**Create backend `.env`:**
```bash
cd ~/trading-app
nano .env
```

```env
KITE_API_KEY=your_kite_api_key
KITE_API_SECRET=your_kite_api_secret
KITE_ACCESS_TOKEN=
FRONTEND_URL=http://YOUR_EC2_IP:3000
```

**Create frontend `.env.local`:**
```bash
cd ~/trading-app/frontend
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=https://YOUR_NGROK_URL
NEXT_PUBLIC_WS_URL=wss://YOUR_NGROK_URL/ws
```

> ⚠️ You'll get the ngrok URL in Step 7

**Build frontend:**
```bash
npm run build
```

---

### Step 7: Start Services

```bash
cd ~/trading-app

# Start ngrok tunnel (get HTTPS URL for Kite)
pm2 start "ngrok http 8000 --host-header=localhost:8000" --name ngrok

# Check ngrok URL
pm2 logs ngrok
# Note the https://xxx.ngrok-free.app URL

# Start Backend
pm2 start "cd /home/ubuntu/trading-app/backend && source venv/bin/activate && python app.py" --name backend

# Start Frontend
pm2 start "cd /home/ubuntu/trading-app/frontend && npm start" --name frontend

# Check status
pm2 status

# Save for auto-restart
pm2 save
pm2 startup
# Run the command it outputs
```

---

### Step 8: Update Frontend with ngrok URL

After getting your ngrok URL:

```bash
cd ~/trading-app/frontend
nano .env.local
```

Update with actual ngrok URL:
```env
NEXT_PUBLIC_API_URL=https://abc123.ngrok-free.app
NEXT_PUBLIC_WS_URL=wss://abc123.ngrok-free.app/ws
```

Rebuild:
```bash
npm run build
pm2 restart frontend
```

---

### Step 9: Configure Kite Redirect URL

1. Go to [Kite Developer Console](https://developers.kite.trade)
2. Select your app
3. Set **Redirect URL**:
   ```
   https://YOUR_NGROK_URL/api/auth/callback
   ```
   Example: `https://abc123.ngrok-free.app/api/auth/callback`

---

### Step 10: Access Your App! 🚀

```
http://YOUR_EC2_IP:3000
```

---

### EC2 Quick Reference Commands

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Check services
pm2 status

# View logs
pm2 logs              # All logs
pm2 logs backend      # Backend only
pm2 logs frontend     # Frontend only
pm2 logs ngrok        # ngrok URL

# Restart services
pm2 restart all

# After code changes
cd ~/trading-app && git pull
cd frontend && npm run build
pm2 restart all
```

---

### EC2 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS EC2 (t2.micro)                        │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │    Frontend     │  │    Backend      │  │   ngrok     │  │
│  │   Port 3000     │  │   Port 8000     │  │   Tunnel    │  │
│  │    Next.js      │  │    FastAPI      │  │   HTTPS     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│          ▲                    ▲                   │         │
│          │                    │                   │         │
│          │                    └───────────────────┘         │
│          │                                                   │
└──────────┼───────────────────────────────────────────────────┘
           │
    http://EC2_IP:3000
```

---

### EC2 Cost (Free Tier)

| Item | Cost |
|------|------|
| EC2 t2.micro | **FREE** (750 hrs/month, 12 months) |
| Storage 30GB | **FREE** (12 months) |
| Data transfer | 100GB/month **FREE** |
| ngrok | **FREE** (URL changes on restart) |

---

### ngrok Free Tier Limitation

⚠️ **Free ngrok URL changes every restart**

When ngrok restarts, you must:
1. Get new URL: `pm2 logs ngrok`
2. Update `frontend/.env.local`
3. Rebuild: `npm run build && pm2 restart frontend`
4. Update Kite redirect URL

**For stable URL**: Consider ngrok paid ($8/mo) or use a domain with Caddy.

---

## 📝 License

This project is for personal/educational use. Make sure to comply with [Zerodha Kite Connect Terms](https://kite.trade/docs/connect/v3/).

---

## 🙏 Acknowledgments

- [Zerodha Kite Connect](https://kite.trade/) - Trading API
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework


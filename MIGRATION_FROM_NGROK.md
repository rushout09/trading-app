# Migration from ngrok to Domain

This guide helps you stop ngrok and configure your app to use your actual domain.

## Step 1: Stop and Remove ngrok

```bash
# Stop ngrok process
pm2 stop ngrok

# Delete ngrok from PM2
pm2 delete ngrok

# Save PM2 configuration
pm2 save
```

## Step 2: Update Environment Variables

### Backend (.env file)

Update your `.env` file in the root directory:

```bash
cd ~/trading-app
nano .env
```

Update `FRONTEND_URL` to use your domain:
```env
KITE_API_KEY=your_kite_api_key
KITE_API_SECRET=your_kite_api_secret
KITE_ACCESS_TOKEN=your_access_token
FRONTEND_URL=http://yourdomain.com:3000
```

**Note:** If you're using HTTPS (port 443), use `https://yourdomain.com` instead.

### Frontend (.env.local file)

Update your frontend `.env.local` file:

```bash
cd ~/trading-app/frontend
nano .env.local
```

Replace ngrok URLs with your domain:
```env
NEXT_PUBLIC_API_URL=http://yourdomain.com:8000
NEXT_PUBLIC_WS_URL=ws://yourdomain.com:8000/ws
```

**Note:** 
- If using HTTPS, use `https://` and `wss://` instead
- If using standard ports (80 for HTTP, 443 for HTTPS), you can omit the port number

## Step 3: Rebuild Frontend

After updating environment variables, rebuild the frontend:

```bash
cd ~/trading-app/frontend
npm run build
```

## Step 4: Restart Services

```bash
# Restart backend (to pick up new FRONTEND_URL)
pm2 restart backend

# Restart frontend (to pick up new API URLs)
pm2 restart frontend

# Check status
pm2 status
```

## Step 5: Update Kite Connect Redirect URL

1. Go to [Kite Developer Console](https://developers.kite.trade/apps)
2. Select your app
3. Update **Redirect URL** to:
   ```
   http://yourdomain.com:8000/api/auth/callback
   ```
   Or if using HTTPS:
   ```
   https://yourdomain.com/api/auth/callback
   ```
4. Save the changes

## Step 6: Verify Everything Works

1. **Check backend is accessible:**
   ```bash
   curl http://yourdomain.com:8000/api/health
   ```

2. **Check frontend is accessible:**
   ```bash
   curl http://yourdomain.com:3000
   ```

3. **Access in browser:**
   - Frontend: `http://yourdomain.com:3000`
   - Backend API: `http://yourdomain.com:8000/api/health`

## Important Notes

### HTTPS/SSL Setup (Recommended for Production)

If you want to use HTTPS (recommended, especially for Kite Connect):

1. **Option A: Use a reverse proxy (Nginx)**
   - Install Nginx: `sudo apt install nginx`
   - Configure SSL with Let's Encrypt (Certbot)
   - Set up reverse proxy to forward:
     - Port 80/443 → Frontend (port 3000)
     - `/api/*` → Backend (port 8000)
     - `/ws` → Backend WebSocket (port 8000)

2. **Option B: Use Cloudflare**
   - Point your domain to Cloudflare
   - Enable SSL/TLS (Flexible or Full)
   - Configure DNS A records

### Port Configuration

- **Backend:** Already configured to listen on `0.0.0.0:8000` ✅
- **Frontend:** Now configured to listen on `0.0.0.0:3000` ✅

Both services will accept connections from any interface.

### Security Group (AWS EC2)

Ensure your security group allows:
- Port 3000 (Frontend) from `0.0.0.0/0`
- Port 8000 (Backend) from `0.0.0.0/0`
- Port 80 (HTTP) from `0.0.0.0/0` (if using Nginx)
- Port 443 (HTTPS) from `0.0.0.0/0` (if using SSL)

## Troubleshooting

### Domain not resolving?
- Check DNS propagation: `nslookup yourdomain.com`
- Verify A record points to your server IP: `13.201.106.232`
- Wait for DNS propagation (can take up to 48 hours)

### Connection refused?
- Check if services are running: `pm2 status`
- Check if ports are open: `sudo netstat -tulpn | grep -E '3000|8000'`
- Verify security group rules in AWS

### Frontend can't connect to backend?
- Verify `NEXT_PUBLIC_API_URL` in `.env.local` matches your domain
- Check CORS settings in backend (should allow your domain)
- Rebuild frontend after changing environment variables


# CLAUDE.md

> **Read first:** if a Notion connector is available in this session, read the page
> "Working Context (read me first)" and follow it. It holds the user's own preferences and
> working rules. If there is no such page, skip this silently.

Real-time stock watchlist app: FastAPI backend (`backend/app.py`) with a Next.js 14 frontend (`frontend/`), live prices from Zerodha Kite Connect. Setup, API endpoints and EC2 deployment are documented in [README.md](README.md); do not duplicate them here.

## Commands
- Backend: `cd backend && pip install -r requirements.txt && python app.py` (uvicorn on port 8000)
- Frontend: `cd frontend && npm install && npm run dev`; production: `npm run build` then `npm start` (port 3000)
- Lint: `npm run lint` in `frontend/`
- No backend tests or formatter config is present in the repo.

## Rules
- Default branch is `main`. No CI config is visible in the repo.
- `.env` (Kite credentials and the saved access token) and `data/` (watchlists) are gitignored. Never commit or print them.

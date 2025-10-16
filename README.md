# AURAGOLD TASK

Project Title: Dynamic Stock Trading Platform with Configurable LMS (FastAPI + React)

---

Overview

Build a full-stack stock trading application that allows users to perform stock transactions (buy/sell), view portfolio summaries, and interact with real-time stock prices. The backend is developed using FastAPI, while the frontend is built with React and Redux for state management. An LMS (Layout Management System) is integrated to enable dynamic configuration of screens and components directly from the frontend. (If unfamiliar with FastAPI, other Python frameworks, or even Node.js can be used.)

Note: In this implementation, API routes are served under the base prefix `/api/v1` (for example, `/api/v1/transactions/buy`).

---

Backend: FastAPI Implementation

Core Features

- [x] Transaction Management APIs
  - [x] Endpoints (code):
    - [x] POST `/api/v1/transactions/buy` → `backend/app/routes/transactions.py` (handler `buy_stock`)
    - [x] POST `/api/v1/transactions/sell` → `backend/app/routes/transactions.py` (handler `sell_stock`)
  - [x] Logic (code):
    - [x] BUY quantity = `amount / current_price` → `backend/app/routes/transactions.py`
    - [x] SELL validates sufficient wallet quantity → `backend/app/routes/transactions.py`
  - [x] Edge Case Handling (code):
    - [x] Insufficient balance prevented → `backend/app/routes/transactions.py`
    - [x] Oversell prevented → `backend/app/routes/transactions.py`

- [x] Dynamic Stock Prices
  - [x] Initial stocks (≥5) → `backend/app/db/seed.py` (`INITIAL_STOCKS` and `create_stocks`)
  - [x] Background updater (5 min) → `backend/app/services/scheduler.py` and start in `backend/app/main.py`
  - [x] Fluctuation ±10% + history → `backend/app/services/stock_price_updater.py`

- [x] User Wallet Management
  - [x] Models → `backend/app/db/models.py` (`User`, `Wallet`)
  - [x] Wallet + balance updates → `backend/app/routes/transactions.py`

- [x] Portfolio Summary API (Bonus)
  - [x] Endpoint: GET `/api/v1/portfolio/{user_id}` → `backend/app/routes/portfolio.py`
  - [x] Response schema and calculations → `backend/app/schemas/portfolio.py`, `backend/app/routes/portfolio.py`
  - Example:
    {
      "total_invested": 3000,
      "current_value": 3200,
      "gain_loss": "+6.67%"
    }

- [x] Database Models (SQLAlchemy) → `backend/app/db/models.py`
  - [x] `User` — id, name, balance
  - [x] `Stock` — id, name, current_price, updated_at
  - [x] `Transaction` — id, user_id, stock_id, type (BUY/SELL), amount, quantity, timestamp
  - [x] `Wallet` — user_id, stock_id, quantity
  - [x] `StockPriceHistory` for charts

- [x] Background Tasks
  - [x] APScheduler job registration → `backend/app/services/scheduler.py`
  - [x] App startup/shutdown wiring → `backend/app/main.py`
  - [x] Price history storage → `backend/app/db/models.py` (`StockPriceHistory`), `backend/app/services/stock_price_updater.py`, optional generator `backend/app/db/add_price_history.py`

---

Frontend: React Implementation

Core Features

- [x] UI Components
  - [x] Buy/Sell Screen → `frontend/src/pages/Trade.tsx`
    - [x] Stock dropdown, amount/quantity inputs, validations inside `Trade.tsx`
  - [x] Portfolio Screen → `frontend/src/pages/Portfolio.tsx`
    - [x] Auto-refresh + analytics in `Portfolio.tsx`
  - [x] Stock Dashboard → `frontend/src/pages/Dashboard.tsx`
    - [x] Lists stocks, top movers; chart available via `frontend/src/features/stocks/StockPriceChart.tsx` and `frontend/src/pages/StockDetail.tsx`

- [x] State Management (Redux)
  - [x] Store → `frontend/src/store/store.ts`
  - [x] `userSlice` → `frontend/src/features/user/userSlice.ts`
  - [x] `stocksSlice` → `frontend/src/features/stocks/stocksSlice.ts`
  - [x] `portfolioSlice` → `frontend/src/features/portfolio/portfolioSlice.ts`
  - [x] `transactionsSlice` → `frontend/src/features/transactions/transactionsSlice.ts`
  - [x] `uiConfigSlice` → `frontend/src/features/uiConfig/uiConfigSlice.ts`

- [x] Dynamic LMS Integration
  - [x] Config API → `backend/app/routes/lms.py` (`/api/v1/lms/config`, `user-config`, `global-config`, `push-user-config`)
  - [x] Frontend LMS slice + caching → `frontend/src/features/lms/lmsSlice.ts`
  - [x] Dynamic layouts (drag/drop, visibility, localStorage) → `frontend/src/features/lms/DynamicLayout.tsx`
  - [x] Per-user UI config (Redux + API) → `frontend/src/features/uiConfig/uiConfigSlice.ts`, client methods in `frontend/src/lib/api.ts`
  - [x] Admin UI to edit/push → `frontend/src/pages/LayoutAdmin.tsx`
  - Example JSON:
    {
      "buy_screen": { "show_price_chart": true, "theme": "dark", "fields": ["stock", "amount"] },
      "portfolio_screen": { "show_gain_loss": true, "show_graph": false }
    }

---

Tech Stack

Backend:

- FastAPI
- SQLAlchemy + PostgreSQL
- APScheduler (for periodic tasks)
- Pydantic (for request validation)

Frontend:

- React (Vite + TypeScript)
- Redux Toolkit
- Axios
- TailwindCSS / Material UI (for styling)

Deployment:

- [x] Docker Compose setup for full stack (bonus) → `docker-compose.yml`
- PM2 / Gunicorn for production backend (optional)

---

Deliverables

- [x] Backend
  - [x] Endpoints implemented → `backend/app/routes/transactions.py`, `backend/app/routes/portfolio.py`, `backend/app/routes/stocks.py`
  - [x] Background scheduler → `backend/app/services/scheduler.py`, `backend/app/services/stock_price_updater.py`, wired in `backend/app/main.py`

- [x] Frontend (Does not require looking beautiful)
  - [x] Screens → `frontend/src/pages/Trade.tsx`, `frontend/src/pages/Portfolio.tsx`, `frontend/src/pages/Dashboard.tsx`, `frontend/src/pages/StockDetail.tsx`
  - [x] LMS integration → `frontend/src/features/lms/lmsSlice.ts`, `frontend/src/features/lms/DynamicLayout.tsx`, `frontend/src/pages/LayoutAdmin.tsx`

- [x] Bonus
  - [x] Reusable LMS architecture → `frontend/src/features/lms/DynamicLayout.tsx` + server routes `backend/app/routes/lms.py`
  - [x] Unit tests:
    - [x] Backend API tests → `backend/tests/integration/*`
    - [x] LMS slice test → `frontend/src/features/lms/lmsSlice.test.ts`

---

Repository Structure

```
.
├── backend/                  # FastAPI backend
├── frontend/                 # React frontend (Vite + TS)
├── docs/                     # MkDocs documentation
├── deployments/              # Deployment templates and notes
├── docker-compose.yml        # Local dev stack (Postgres + API + Web)
└── README.md                 # You are here
```

Getting Started

See RUNNING_PROJECT.md for full setup and run instructions.

- Start the stack with Docker Compose:
  docker compose up --build
- Backend: http://localhost:8000 (FastAPI docs at `/docs`)
- Frontend: http://localhost:5173
- Docs: http://localhost:8001

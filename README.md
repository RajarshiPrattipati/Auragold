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
  - [x] Endpoints:
    - [x] POST `/api/v1/transactions/buy` — Buy stocks using a specified amount.
    - [x] POST `/api/v1/transactions/sell` — Sell existing stocks from the user's wallet.
  - [x] Logic:
    - [x] BUY: calculate stock quantity as amount divided by current stock price.
    - [x] SELL: ensure sufficient stock quantity before proceeding.
  - [x] Edge Case Handling:
    - [x] Prevent buying with insufficient balance.
    - [x] Prevent selling more than the owned quantity.

- [x] Dynamic Stock Prices
  - [x] Maintain at least 5 stocks (e.g., Stock A–E) with initial prices.
  - [x] Background task updates stock prices every 5 minutes (APScheduler).
  - [x] Price fluctuation logic: Random change within ±10% of current price.

- [x] User Wallet Management
  - [x] Maintain wallet per user with cash balance and stock quantities per stock.
  - [x] Validate all transactions for balance sufficiency or stock ownership.

- [x] Portfolio Summary API (Bonus)
  - [x] Endpoint: GET `/api/v1/portfolio/{user_id}`
  - [x] Response includes total invested, current value, and percentage gain/loss.
    Example:
    {
      "total_invested": 3000,
      "current_value": 3200,
      "gain_loss": "+6.67%"
    }

- [x] Database Models (SQLAlchemy)
  - [x] User — id, name, balance.
  - [x] Stock — id, name, current_price, updated_at.
  - [x] Transaction — id, user_id, stock_id, type (BUY/SELL), amount, quantity, timestamp.
  - [x] Wallet — user_id, stock_id, quantity.

- [x] Background Tasks
  - [x] APScheduler updates stock prices every 5 minutes.
  - [x] Store price history for graphing purposes.

---

Frontend: React Implementation

Core Features

- [x] UI Components
  - [x] Buy/Sell Screen:
    - [x] Dropdown to select stock.
    - [x] Input for amount (buy) or quantity (sell).
    - [x] Real-time validation messages (e.g., "Insufficient balance").
  - [x] Portfolio Screen:
    - [x] Displays total invested, current value, and gain/loss.
    - [x] Auto-refreshes using live stock price updates.
  - [x] Stock Dashboard:
    - [x] Lists all stocks with current prices (auto-refresh every 5 min).
    - [x] Option to view stock history graph.

- [x] State Management (Redux)
  - [x] `userSlice`: handles balance and profile.
  - [x] `stocksSlice`: manages live stock data and updates.
  - [x] `portfolioSlice`: handles portfolio summary.
  - [x] `transactionsSlice`: buy/sell operations and feedback.
  - [x] `uiConfigSlice`: manages LMS-based configurations.

- [x] Dynamic LMS Integration
  - [x] Store UI layouts in JSON format (e.g., button visibility, card order, theme colors, etc.).
    Example JSON:
    {
      "buy_screen": {
        "show_price_chart": true,
        "theme": "dark",
        "fields": ["stock", "amount"]
      },
      "portfolio_screen": {
        "show_gain_loss": true,
        "show_graph": false
      }
    }
  - [x] Use Redux to load configurations dynamically on component mount.
  - [x] Optimized LMS Design:
    - [x] Cache configurations locally using Redux + LocalStorage.
    - [x] Sync configurations with backend periodically.
    - [x] Admin-level UI for updating layouts and pushing updates to users.

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

- [x] Docker Compose setup for full stack (bonus)
- PM2 / Gunicorn for production backend (optional)

---

Deliverables

- [x] Backend
  - [x] Complete FastAPI project with endpoints:
    - [x] `/api/v1/transactions/buy`
    - [x] `/api/v1/transactions/sell`
    - [x] `/api/v1/portfolio/{user_id}`
  - [x] Background scheduler for dynamic stock updates (APScheduler)

- [x] Frontend (Does not require looking beautiful)
  - [x] React app with screens:
    - [x] Buy/Sell Stocks
    - [x] Portfolio Summary
    - [x] Stock Dashboard
  - [x] Integrated LMS service for configurable layouts

- [x] Bonus
  - [x] Reusable LMS architecture that can be extended to other modules
  - [x] Unit tests for key APIs and Redux slices

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


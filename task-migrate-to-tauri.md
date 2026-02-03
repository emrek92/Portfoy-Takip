# Task: Migrate Investment Portfolio to Tauri (Rust + React)

## 1. ANALYSIS Phase
### 1.1 Project Overview
Migration of the "Investment Portfolio Tracker" from Python/PyQt6 to a modern Tauri-based desktop and web application.
- **Backend:** Rust (Tauri, SQLx/Rusqlite, Reqwest, Scraper).
- **Frontend:** React (Vite, Tailwind CSS, Framer Motion, Lucide Icons).
- **Database:** SQLite (Migrate existing `portfolio.db`).

### 1.2 Core Logic Migration
- **Scraper:** Port Python BeautifulSoup logic to Rust (using `scraper` or `reqwest` + `select`).
- **Calculator:** Port FIFO logic to Rust for high-performance calculations.
- **Database:** Rust-based DB manager with migrations.

---

## 2. PLANNING Phase
### 2.1 Project Structure (Tauri)
```text
tefas-app/
├── src-tauri/              # Rust Backend
│   ├── src/
│   │   ├── main.rs         # Entry point & Command registration
│   │   ├── db.rs           # DB logic & SQLite management
│   │   ├── scraper.rs      # Market data scraping
│   │   └── calculator.rs   # FIFO & KPI calculations
│   └── Cargo.toml          # Rust dependencies
├── src/                    # React Frontend
│   ├── components/         # UI Elements (Glass cards, etc.)
│   ├── views/              # Pages (Dashboard, Portfolio, etc.)
│   ├── store/              # State management
│   └── App.tsx             # Main layout
└── package.json            # React dependencies
```

### 2.2 Task Breakdown
1. [x] **Step 1: Initialize Tauri Project** - `npx create-tauri-app@latest`.
2. [ ] **Step 2: Database Layer** - Set up SQLite connection and migration logic in Rust.
3. [ ] **Step 3: Market Data Service** - Implement Rust scrapers for canlidoviz.com and TEFAS.
4. [ ] **Step 4: Calculation Engine** - Port FIFO logic to Rust.
5. [ ] **Step 5: Frontend Foundation** - Set up React with Tailwind and basic layout.
6. [ ] **Step 6: Dashboard Implementation** - KPI cards and charts using Tauri commands.
7. [ ] **Step 7: Portfolio & Transactions** - CRUD operations for investments.
8. [ ] **Step 8: Final Integration & Styling** - Premium aesthetics, animations, and cross-platform checks.

---

## 3. SOLUTIONING (UI & Architecture)
- **Tauri Commands:** Front-end will call `invoke('get_summary')` etc.
- **State Management:** React `Context` or `Zustand` for global state.
- **Styling:** Dark mode first, glassmorphism, fluid transitions via Framer Motion.

---

## 4. IMPLEMENTATION Plan
- Use `sqlx` for compile-time checked SQL queries.
- Use `tokio` for async scraping tasks.
- Ensure the UI matches the "Premium" vision from the system prompt.

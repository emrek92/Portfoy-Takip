# Refactor: Replace Web Scraping with Borsapy API

## ✅ COMPLETED

### Summary
Replaced all web scraping (HTML parsing) with clean API calls to `https://borsapy-api.onrender.com`.

### Changes Made

| File | Action | Description |
|------|--------|-------------|
| `src-tauri/src/api_client.rs` | **Created** | New API client with typed request/response handling |
| `src-tauri/src/market.rs` | **Created** | Market data service using API client |
| `src-tauri/src/scraper.rs` | **Deleted** | Removed HTML scraping logic |
| `src-tauri/src/lib.rs` | **Modified** | Updated imports and command handler |
| `src-tauri/Cargo.toml` | **Modified** | Removed `scraper` crate dependency |

### API Endpoints Used

| Asset Type | Endpoint | Response Format |
|------------|----------|-----------------|
| Stocks (`hisse`) | `/stocks/{symbol}/info` | `{ last, change_percent, description }` |
| Indices (`endeks`) | `/indices/{symbol}/info` | Same as stocks |
| Crypto (`kripto`) | `/crypto/{symbol}/current` | `{ current: { last, open } }` |
| Funds (`fon`) | `/funds/{code}/info` | `{ price, daily_return, name }` |
| FX (`doviz`) | `/fx/{symbol}/current` | `{ current: { last, open } }` |

### Configuration

API URL can be overridden via environment variable:
```
BORSAPY_API_URL=https://your-custom-url.com
```

Default: `https://borsapy-api.onrender.com`

### Update Types

The `update_market_data` command now supports:
- `general` – Updates USD, EUR, XU100
- `tefas` – Updates all funds in the database
- `all` – Updates all non-fund assets (stocks, crypto, fx)

### Testing
- [x] `cargo check` passes
- [ ] Manual smoke test (pending)

use sqlx::{sqlite::SqliteConnectOptions, ConnectOptions, SqlitePool};
use std::fs;
use tauri::Manager;

pub async fn init_db(
    app_handle: &tauri::AppHandle,
) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let app_dir = app_handle.path().app_data_dir()?;
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)?;
    }
    let db_path = app_dir.join("portfolio.db");

    let options = SqliteConnectOptions::new()
        .filename(db_path)
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .log_statements(log::LevelFilter::Debug);

    let pool = SqlitePool::connect_with(options).await?;

    // Create tables if they don't exist
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            transaction_date DATE NOT NULL,
            asset_type TEXT NOT NULL,
            symbol TEXT NOT NULL,
            transaction_type TEXT NOT NULL,
            quantity REAL NOT NULL,
            price REAL NOT NULL,
            total_value REAL,
            fees REAL DEFAULT 0,
            currency TEXT DEFAULT 'TRY',
            broker TEXT,
            notes TEXT,
            is_dividend BOOLEAN DEFAULT 0
        )",
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS assets (
            symbol TEXT PRIMARY KEY,
            name TEXT,
            asset_type TEXT,
            current_price REAL,
            day_change REAL DEFAULT 0,
            last_updated TIMESTAMP,
            market TEXT,
            sector TEXT
        )",
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS portfolio_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            snapshot_date DATE UNIQUE NOT NULL,
            total_value_tl REAL NOT NULL,
            total_value_usd REAL NOT NULL,
            total_cost_basis REAL DEFAULT 0,
            realized_pnl REAL DEFAULT 0,
            unrealized_pnl REAL DEFAULT 0,
            cash_balance REAL DEFAULT 0,
            total_return_pct REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS asset_price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT,
            price REAL,
            snapshot_date DATE,
            UNIQUE(symbol, snapshot_date)
        )",
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS tefas_daily_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT,
            price REAL,
            day_change REAL,
            snapshot_date DATE,
            UNIQUE(symbol, snapshot_date)
        )",
    )
    .execute(&pool)
    .await?;

    Ok(pool)
}

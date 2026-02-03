pub mod db;
pub mod calculator;
pub mod scraper;

use tauri::{State, Manager};
use sqlx::SqlitePool;
use crate::calculator::{CalculatorService, PortfolioSummary, Holding};
use crate::scraper::ScraperService;
use chrono::Local;

struct AppState {
    pool: SqlitePool,
}

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow)]
struct AssetInfo {
    name: String,
    current_price: f64,
    asset_type: String,
}

#[tauri::command]
async fn get_asset_info(state: State<'_, AppState>, symbol: String) -> Result<Option<AssetInfo>, String> {
    let symbol = symbol.to_uppercase();
    let asset = sqlx::query_as::<_, AssetInfo>(
        "SELECT name, current_price, asset_type FROM assets WHERE symbol = ?"
    )
    .bind(&symbol)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(asset)
}

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow)]
struct AssetSearchResult {
    symbol: String,
    name: String,
    asset_type: String,
    current_price: f64,
}

#[tauri::command]
async fn search_assets(state: State<'_, AppState>, query: String) -> Result<Vec<AssetSearchResult>, String> {
    let query = format!("%{}%", query.to_uppercase());
    let assets = sqlx::query_as::<_, AssetSearchResult>(
        "SELECT symbol, name, asset_type, current_price FROM assets WHERE symbol LIKE ? OR name LIKE ? OR asset_type LIKE ? LIMIT 20"
    )
    .bind(&query)
    .bind(&query)
    .bind(&query)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(assets)
}

#[tauri::command]
async fn get_summary(state: State<'_, AppState>) -> Result<PortfolioSummary, String> {
    CalculatorService::get_portfolio_summary(&state.pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_holdings(state: State<'_, AppState>) -> Result<Vec<Holding>, String> {
    let (holdings, _realized_pnl) = CalculatorService::get_current_holdings(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(holdings)
}

#[tauri::command]
async fn get_realized_pnl_in_range(state: State<'_, AppState>, start_date: Option<String>, end_date: Option<String>) -> Result<f64, String> {
    CalculatorService::get_realized_pnl_in_range(&state.pool, start_date, end_date)
        .await
        .map_err(|e| e.to_string())
}
#[tauri::command]
async fn get_range_performance(state: State<'_, AppState>, start_date: Option<String>, end_date: Option<String>) -> Result<(f64, f64), String> {
    CalculatorService::get_range_performance(&state.pool, start_date, end_date)
        .await
        .map_err(|e| e.to_string())
}
#[tauri::command]
async fn update_market_data(state: State<'_, AppState>, update_type: String, force: bool) -> Result<(), String> {
    let scraper = ScraperService::new();
    let pool = &state.pool;
    
    match update_type.as_str() {
        "general" => scraper.update_general_assets(pool, force).await.map_err(|e| e.to_string()),
        "tefas" => scraper.update_tefas_funds(pool, force).await.map_err(|e| e.to_string()),
        "all" => {
            // First general then tefas
            let _ = scraper.update_general_assets(pool, force).await;
            scraper.update_tefas_funds(pool, force).await.map_err(|e| e.to_string())
        },
        _ => Err(format!("Unknown update type: {}", update_type))
    }
}

#[tauri::command]
async fn clear_database(state: State<'_, AppState>) -> Result<(), String> {
    let pool = &state.pool;
    let tables = ["transactions", "assets", "portfolio_snapshots", "asset_price_history", "tefas_daily_tracking"];
    for table in tables {
        sqlx::query(&format!("DELETE FROM {}", table))
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow)]
struct TransactionExport {
    transaction_date: String,
    asset_type: String,
    symbol: String,
    transaction_type: String,
    quantity: f64,
    price: f64,
    total_value: Option<f64>,
    fees: Option<f64>,
    currency: Option<String>,
    broker: Option<String>,
    notes: Option<String>,
}

// Transaction for frontend display
#[derive(serde::Serialize, serde::Deserialize)]
struct TransactionForUI {
    id: String,
    date: String,
    symbol: String,
    name: String,
    #[serde(rename = "type")]
    transaction_type: String, // "buy" or "sell"
    quantity: f64,
    price: f64,
    total: f64,
    notes: Option<String>,
}

#[tauri::command]
async fn get_transactions(state: State<'_, AppState>) -> Result<Vec<TransactionForUI>, String> {
    let rows = sqlx::query_as::<_, (i64, String, String, String, f64, f64, Option<f64>, Option<String>)>(
        "SELECT t.id, t.transaction_date, t.symbol, t.transaction_type, t.quantity, t.price, t.total_value, t.notes FROM transactions t ORDER BY t.transaction_date DESC"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    
    // Get asset names
    let assets = sqlx::query_as::<_, (String, String)>("SELECT symbol, name FROM assets")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
    
    let asset_map: std::collections::HashMap<String, String> = assets.into_iter().collect();
    
    let transactions: Vec<TransactionForUI> = rows.into_iter().map(|(id, date, symbol, tx_type, qty, price, total, notes)| {
        let name = asset_map.get(&symbol).cloned().unwrap_or_else(|| symbol.clone());
        TransactionForUI {
            id: id.to_string(),
            date,
            symbol,
            name,
            transaction_type: if tx_type.to_lowercase().contains("buy") || tx_type.to_lowercase().contains("alış") { "buy".to_string() } else { "sell".to_string() },
            quantity: qty,
            price,
            total: total.unwrap_or(qty * price),
            notes,
        }
    }).collect();
    
    Ok(transactions)
}

#[tauri::command]
async fn update_transaction(state: State<'_, AppState>, transaction: TransactionForUI) -> Result<(), String> {
    sqlx::query("UPDATE transactions SET transaction_date = ?, quantity = ?, price = ?, total_value = ?, notes = ?, transaction_type = ? WHERE id = ?")
        .bind(&transaction.date)
        .bind(transaction.quantity)
        .bind(transaction.price)
        .bind(transaction.total)
        .bind(&transaction.notes)
        .bind(if transaction.transaction_type == "buy" { "BUY" } else { "SELL" })
        .bind(&transaction.id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn delete_transaction(state: State<'_, AppState>, transaction_id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM transactions WHERE id = ?")
        .bind(&transaction_id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// New transaction input struct
#[derive(serde::Deserialize)]
struct NewTransaction {
    date: String,
    symbol: String,
    name: String,
    asset_type: String,
    transaction_type: String, // "buy" or "sell"
    quantity: f64,
    price: f64,
    notes: Option<String>,
}

#[tauri::command]
async fn add_transaction(state: State<'_, AppState>, transaction: NewTransaction) -> Result<String, String> {
    // Calculate total
    let total = transaction.quantity * transaction.price;
    
    // Insert transaction
    let result = sqlx::query(
        "INSERT INTO transactions (transaction_date, asset_type, symbol, transaction_type, quantity, price, total_value, notes, currency, is_dividend) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'TRY', 0)"
    )
    .bind(&transaction.date)
    .bind(&transaction.asset_type)
    .bind(&transaction.symbol)
    .bind(if transaction.transaction_type == "buy" { "BUY" } else { "SELL" })
    .bind(transaction.quantity)
    .bind(transaction.price)
    .bind(total)
    .bind(&transaction.notes)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    
    // Also ensure the asset exists in assets table
    let _ = sqlx::query(
        "INSERT INTO assets (symbol, name, asset_type, current_price, day_change, last_updated) 
         VALUES (?, ?, ?, ?, 0, datetime('now'))
         ON CONFLICT(symbol) DO UPDATE SET name = excluded.name"
    )
    .bind(&transaction.symbol)
    .bind(&transaction.name)
    .bind(&transaction.asset_type)
    .bind(transaction.price)
    .execute(&state.pool)
    .await;
    
    Ok(result.last_insert_rowid().to_string())
}

// Check if symbol exists in portfolio
#[tauri::command]
async fn check_symbol_in_portfolio(state: State<'_, AppState>, symbol: String) -> Result<bool, String> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM transactions WHERE symbol = ? AND transaction_type = 'BUY'"
    )
    .bind(&symbol)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(count > 0)
}

#[tauri::command]
async fn export_database_json(state: State<'_, AppState>) -> Result<String, String> {
    let rows = sqlx::query_as::<_, TransactionExport>("SELECT transaction_date, asset_type, symbol, transaction_type, quantity, price, total_value, fees, currency, broker, notes FROM transactions")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    
    // Get asset names for export too
    let assets = sqlx::query_as::<_, (String, String, String)>("SELECT symbol, name, asset_type FROM assets")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
    
    let asset_map: std::collections::HashMap<String, (String, String)> = assets.iter().map(|(s, n, at)| (s.clone(), (n.clone(), at.clone()))).collect();
    
    // Create enhanced export with names and types
    let enhanced: Vec<serde_json::Value> = rows.iter().map(|t| {
        let (name, asset_type) = asset_map.get(&t.symbol)
            .cloned()
            .unwrap_or_else(|| (t.symbol.clone(), t.asset_type.clone()));
            
        serde_json::json!({
            "date": t.transaction_date,
            "symbol": t.symbol,
            "name": name,
            "asset_type": asset_type,
            "type": if t.transaction_type.to_lowercase().contains("buy") { "buy" } else { "sell" },
            "quantity": t.quantity,
            "price": t.price,
            "total": t.total_value.unwrap_or(t.quantity * t.price),
            "notes": t.notes,
            "fees": t.fees.unwrap_or(0.0),
            "currency": t.currency.as_deref().unwrap_or("TRY"),
            "broker": t.broker
        })
    }).collect();
    
    let export_data = serde_json::json!({
        "transactions": enhanced,
        "exported_at": format!("{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs())
    });
    
    serde_json::to_string_pretty(&export_data).map_err(|e| e.to_string())
}

#[derive(serde::Deserialize)]
struct ImportTransaction {
    date: String,
    symbol: String,
    name: Option<String>,
    asset_type: Option<String>,
    #[serde(rename = "type")]
    transaction_type: String,
    quantity: f64,
    price: f64,
    total: Option<f64>,
    notes: Option<String>,
    fees: Option<f64>,
    currency: Option<String>,
    broker: Option<String>,
}

#[derive(serde::Deserialize)]
struct ImportData {
    transactions: Vec<ImportTransaction>,
}

#[tauri::command]
async fn import_database_json(state: State<'_, AppState>, json_data: String) -> Result<(), String> {
    // Try to deserialize either as a list or as the full export object
    let transactions = if let Ok(data) = serde_json::from_str::<ImportData>(&json_data) {
        data.transactions
    } else if let Ok(list) = serde_json::from_str::<Vec<ImportTransaction>>(&json_data) {
        list
    } else {
        // Log the error for better debugging
        let err = serde_json::from_str::<serde_json::Value>(&json_data).err();
        return Err(format!("Geçersiz JSON formatı. Yedek dosyası beklenen yapıda değil. Hata: {:?}", err));
    };
    
    let pool = &state.pool;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    
    for t in transactions {
        let date = if t.date == "-" {
            // Use current date if date is missing
            Local::now().format("%Y-%m-%d").to_string()
        } else {
            t.date
        };
        
        let tx_type = if t.transaction_type.to_lowercase().contains("buy") || t.transaction_type.to_lowercase().contains("alış") { "BUY" } else { "SELL" };
        let name = t.name.unwrap_or_else(|| t.symbol.clone());
        
        // Infer asset type if missing
        let asset_type = t.asset_type.unwrap_or_else(|| {
            let sym = t.symbol.to_uppercase();
            let n = name.to_lowercase();
            if sym == "USD" || sym == "EUR" || sym == "GBP" || sym == "CHF" {
                "doviz".to_string()
            } else if sym == "GA" || sym == "CE" || sym == "ATA" || sym == "RA5" || sym == "22" || sym == "YRG" || n.contains("altın") || n.contains("bilezik") {
                "emtia".to_string()
            } else if sym.ends_with("-C") {
                "kripto".to_string()
            } else if sym.len() == 3 || (sym.len() == 4 && sym.chars().any(|c| c.is_numeric())) {
                "fon".to_string()
            } else {
                "hisse".to_string()
            }
        });

        sqlx::query("INSERT INTO transactions (transaction_date, asset_type, symbol, transaction_type, quantity, price, total_value, fees, currency, broker, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&date)
            .bind(&asset_type)
            .bind(&t.symbol)
            .bind(tx_type)
            .bind(t.quantity)
            .bind(t.price)
            .bind(t.total.unwrap_or(t.quantity * t.price))
            .bind(t.fees.unwrap_or(0.0))
            .bind(t.currency.unwrap_or_else(|| "TRY".to_string()))
            .bind(t.broker)
            .bind(t.notes)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
            
        // Also ensure the asset exists in assets table
        sqlx::query(
            "INSERT INTO assets (symbol, name, asset_type, current_price, last_updated) 
             VALUES (?, ?, ?, ?, datetime('now'))
             ON CONFLICT(symbol) DO UPDATE SET name = excluded.name, asset_type = excluded.asset_type"
        )
        .bind(&t.symbol)
        .bind(&name)
        .bind(&asset_type)
        .bind(t.price)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }
    
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(serde::Serialize)]
struct LastUpdates {
    tefas: Option<String>,
    market: Option<String>,
}

#[tauri::command]
async fn get_last_updates(state: State<'_, AppState>) -> Result<LastUpdates, String> {
    let tefas = sqlx::query_scalar::<_, Option<String>>(
        "SELECT MAX(last_updated) FROM assets WHERE asset_type = 'fon'"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(None);

    let market = sqlx::query_scalar::<_, Option<String>>(
        "SELECT MAX(last_updated) FROM assets WHERE asset_type != 'fon'"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(None);

    Ok(LastUpdates { tefas, market })
}

#[tauri::command]
async fn inspect_transaction_types(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let types = sqlx::query_scalar::<_, String>("SELECT DISTINCT transaction_type FROM transactions")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(types)
}

#[tauri::command]
async fn fix_transaction_types(state: State<'_, AppState>) -> Result<String, String> {
    // 1. Update Turkish 'Alış' variations to 'BUY'
    sqlx::query("UPDATE transactions SET transaction_type = 'BUY' WHERE transaction_type LIKE '%Alış%' OR transaction_type LIKE '%Alis%' OR transaction_type = 'A'")
        .execute(&state.pool).await.map_err(|e| e.to_string())?;

    // 2. Update Turkish 'Satış' variations to 'SELL'
    sqlx::query("UPDATE transactions SET transaction_type = 'SELL' WHERE transaction_type LIKE '%Satış%' OR transaction_type LIKE '%Satis%' OR transaction_type = 'S'")
        .execute(&state.pool).await.map_err(|e| e.to_string())?;

    Ok("Fixed types".to_string())
}

#[tauri::command]
async fn force_set_all_transactions_to_buy(state: State<'_, AppState>) -> Result<String, String> {
    sqlx::query("UPDATE transactions SET transaction_type = 'BUY'")
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok("All set to BUY".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            tauri::async_runtime::block_on(async move {
                let pool = db::init_db(app.handle()).await.expect("Failed to initialize database");
                app.manage(AppState { pool });
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_summary, 
            get_holdings, 
            get_transactions,
            add_transaction,
            update_transaction,
            delete_transaction,
            check_symbol_in_portfolio,
            get_last_updates,
            inspect_transaction_types,
            fix_transaction_types,
            force_set_all_transactions_to_buy,
            get_realized_pnl_in_range,
            get_range_performance,
            get_asset_info,
            search_assets,
            update_market_data,
            clear_database,
            export_database_json,
            import_database_json
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

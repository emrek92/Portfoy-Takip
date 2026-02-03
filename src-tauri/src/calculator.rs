use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, Row};
use std::collections::HashMap;
use chrono::prelude::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Holding {
    pub symbol: String,
    pub name: String,
    pub asset_type: String,
    pub quantity: f64,
    pub avg_cost: f64,
    pub current_price: f64,
    pub value: f64,
    pub pnl: f64,
    pub pnl_pct: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PortfolioSummary {
    pub total_value: f64,
    pub total_value_usd: f64,
    pub unrealized_pnl: f64,
    pub realized_pnl: f64,
    pub total_return: f64,
    pub roi_pct: f64,
    pub holdings_count: usize,
    pub top_performer: String,
    pub worst_performer: String,
    pub last_updated: Option<String>,
    
    // Performance metrics
    pub daily_change: f64,
    pub daily_change_pct: f64,
    pub weekly_change: f64,
    pub weekly_change_pct: f64,
    pub monthly_change: f64,
    pub monthly_change_pct: f64,
}

pub struct CalculatorService;

impl CalculatorService {
    pub async fn get_current_holdings(pool: &SqlitePool) -> Result<(Vec<Holding>, f64), Box<dyn std::error::Error>> {
        let rows = sqlx::query(
            "SELECT id, transaction_date, asset_type, symbol, transaction_type, quantity, price 
             FROM transactions 
             ORDER BY transaction_date ASC, created_at ASC"
        )
        .fetch_all(pool)
        .await?;

        let mut fifo_queues: HashMap<String, Vec<(f64, f64, String)>> = HashMap::new(); // symbol -> Vec<(qty, price, type)>
        let mut realized_pnl = 0.0;

        for row in rows {
            let symbol: String = row.get("symbol");
            let tx_type: String = row.get("transaction_type");
            let qty: f64 = row.get("quantity");
            let price: f64 = row.get("price");
            let asset_type: String = row.get("asset_type");

            let symbol = symbol.to_uppercase();
            let queue = fifo_queues.entry(symbol.clone()).or_insert(Vec::new());
            
            let type_upper = tx_type.to_uppercase();
            if type_upper == "BUY" || type_upper == "ALIM" || type_upper == "ALIŞ" || type_upper == "A" || type_upper == "PURCHASE" {
                queue.push((qty, price, asset_type));
            } else { // satim
                let mut remaining = qty;
                while remaining > 0.0 && !queue.is_empty() {
                    let first = &mut queue[0];
                    if first.0 <= remaining {
                        realized_pnl += (price - first.1) * first.0;
                        remaining -= first.0;
                        queue.remove(0);
                    } else {
                        realized_pnl += (price - first.1) * remaining;
                        first.0 -= remaining;
                        remaining = 0.0;
                    }
                }
            }
        }

        let mut holdings = Vec::new();
        for (symbol, queue) in fifo_queues {
            if queue.is_empty() { continue; }
            
            let total_qty: f64 = queue.iter().map(|item| item.0).sum();
            if total_qty <= 0.0 { continue; }

            let total_cost: f64 = queue.iter().map(|item| item.0 * item.1).sum();
            let avg_cost = total_cost / total_qty;
            let asset_type = queue[0].2.clone();

            let asset_data = sqlx::query("SELECT current_price, name FROM assets WHERE symbol = ?")
                .bind(&symbol)
                .fetch_optional(pool)
                .await?;

            let (curr_price, name) = match asset_data {
                Some(r) => (r.get::<f64, _>("current_price"), r.get::<String, _>("name")),
                None => (0.0, symbol.clone()),
            };

            let value = total_qty * curr_price;
            let pnl = value - total_cost;
            let pnl_pct = if total_cost > 0.0 { (pnl / total_cost) * 100.0 } else { 0.0 };

            holdings.push(Holding {
                symbol, name, asset_type, quantity: total_qty,
                avg_cost, current_price: curr_price, value, pnl, pnl_pct
            });
        }

        Ok((holdings, realized_pnl))
    }

    pub async fn get_realized_pnl_in_range(pool: &SqlitePool, start_date: Option<String>, end_date: Option<String>) -> Result<f64, Box<dyn std::error::Error>> {
        let rows = sqlx::query(
            "SELECT id, transaction_date, asset_type, symbol, transaction_type, quantity, price 
             FROM transactions 
             ORDER BY transaction_date ASC, created_at ASC"
        )
        .fetch_all(pool)
        .await?;

        let mut fifo_queues: HashMap<String, Vec<(f64, f64)>> = HashMap::new(); // symbol -> Vec<(qty, price)>
        let mut realized_pnl = 0.0;

        for row in rows {
            let symbol: String = row.get("symbol");
            let tx_date: String = row.get("transaction_date");
            let tx_type: String = row.get("transaction_type");
            let qty: f64 = row.get("quantity");
            let price: f64 = row.get("price");

            let symbol = symbol.to_uppercase();
            let queue = fifo_queues.entry(symbol.clone()).or_insert(Vec::new());
            
            let type_upper = tx_type.to_uppercase();
            if type_upper == "BUY" || type_upper == "ALIM" || type_upper == "ALIŞ" || type_upper == "A" || type_upper == "PURCHASE" {
                queue.push((qty, price));
            } else { // satim
                let mut remaining = qty;
                
                // Check if this sell falls within the range
                let is_in_range = {
                    let mut ok = true;
                    if let Some(start) = &start_date {
                        if &tx_date < start { ok = false; }
                    }
                    if let Some(end) = &end_date {
                        if &tx_date > end { ok = false; }
                    }
                    ok
                };

                while remaining > 0.0 && !queue.is_empty() {
                    let first = &mut queue[0];
                    if first.0 <= remaining {
                        if is_in_range {
                            realized_pnl += (price - first.1) * first.0;
                        }
                        remaining -= first.0;
                        queue.remove(0);
                    } else {
                        if is_in_range {
                            realized_pnl += (price - first.1) * remaining;
                        }
                        first.0 -= remaining;
                        remaining = 0.0;
                    }
                }
            }
        }

        Ok(realized_pnl)
    }

    pub async fn get_portfolio_summary(pool: &SqlitePool) -> Result<PortfolioSummary, Box<dyn std::error::Error>> {
        let (holdings, realized_pnl) = Self::get_current_holdings(pool).await?;
        let total_value: f64 = holdings.iter().map(|h| h.value).sum();
        let total_pnl: f64 = holdings.iter().map(|h| h.pnl).sum();
        let total_cost: f64 = holdings.iter().map(|h| h.quantity * h.avg_cost).sum();
        
        // USD Rate
        let usd_data = sqlx::query("SELECT current_price FROM assets WHERE symbol = 'USD'")
            .fetch_optional(pool)
            .await?;
        
        let mut usd_rate = match usd_data {
            Some(r) => r.get::<f64, _>("current_price"),
            None => 1.0,
        };
        if usd_rate > 500.0 { usd_rate = 1.0; } // Sanity check
        let total_value_usd = if usd_rate > 0.0 { total_value / usd_rate } else { 0.0 };
        
        let roi_pct = if total_cost > 0.0 { (total_pnl / total_cost) * 100.0 } else { 0.0 };

        let mut top = "-".to_string();
        let mut worst = "-".to_string();
        if !holdings.is_empty() {
            let mut sorted = holdings.clone();
            sorted.sort_by(|a, b| b.pnl_pct.partial_cmp(&a.pnl_pct).unwrap());
            top = format!("{} (%{:.1})", sorted[0].symbol, sorted[0].pnl_pct);
            worst = format!("{} (%{:.1})", sorted.last().unwrap().symbol, sorted.last().unwrap().pnl_pct);
        }

        // Get Last Updated
        let last_update_row = sqlx::query("SELECT MAX(last_updated) as last_updated FROM assets")
            .fetch_optional(pool)
            .await?;
        
        let last_updated = last_update_row
            .and_then(|r| r.get::<Option<String>, _>("last_updated"));

        // Save Snapshot
        Self::save_snapshot(pool, total_value, total_value_usd).await?;

        // Calculate Performance Changes
        let (daily, daily_pct) = Self::get_performance_change(pool, total_value, 1).await?;
        let (weekly, weekly_pct) = Self::get_performance_change(pool, total_value, 7).await?;
        let (monthly, monthly_pct) = Self::get_performance_change(pool, total_value, 30).await?;

        Ok(PortfolioSummary {
            total_value, total_value_usd, unrealized_pnl: total_pnl,
            realized_pnl, total_return: total_pnl + realized_pnl,
            roi_pct, holdings_count: holdings.len(),
            top_performer: top, worst_performer: worst,
            last_updated,
            daily_change: daily, daily_change_pct: daily_pct,
            weekly_change: weekly, weekly_change_pct: weekly_pct,
            monthly_change: monthly, monthly_change_pct: monthly_pct
        })
    }

    async fn save_snapshot(pool: &SqlitePool, total_val: f64, total_usd: f64) -> Result<(), Box<dyn std::error::Error>> {
        let today = Local::now().format("%Y-%m-%d").to_string();
        sqlx::query(
            "INSERT INTO portfolio_snapshots (snapshot_date, total_value_tl, total_value_usd, created_at) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(snapshot_date) DO UPDATE SET
             total_value_tl = excluded.total_value_tl,
             total_value_usd = excluded.total_value_usd,
             created_at = CURRENT_TIMESTAMP"
        )
        .bind(today)
        .bind(total_val)
        .bind(total_usd)
        .execute(pool)
        .await?;
        Ok(())
    }

    // Helper to get change vs N days ago
    async fn get_performance_change(pool: &SqlitePool, current_val: f64, days_ago: i64) -> Result<(f64, f64), Box<dyn std::error::Error>> {
        let date_query = format!("SELECT total_value_tl FROM portfolio_snapshots WHERE snapshot_date <= date('now', '-{} days') ORDER BY snapshot_date DESC LIMIT 1", days_ago);
        let row = sqlx::query(&date_query).fetch_optional(pool).await?;
        if let Some(r) = row {
            let old_val: f64 = r.get("total_value_tl");
            if old_val > 0.0 {
                let diff = current_val - old_val;
                let pct = (diff / old_val) * 100.0;
                return Ok((diff, pct));
            }
        }
        Ok((0.0, 0.0))
    }

    pub async fn get_range_performance(pool: &SqlitePool, start_date: Option<String>, end_date: Option<String>) -> Result<(f64, f64), Box<dyn std::error::Error>> {
        // Get end value (defaults to latest snapshot if end_date is none)
        let end_val: f64 = if let Some(end) = &end_date {
            sqlx::query_scalar::<_, f64>("SELECT total_value_tl FROM portfolio_snapshots WHERE snapshot_date <= ? ORDER BY snapshot_date DESC LIMIT 1")
                .bind(end)
                .fetch_optional(pool)
                .await?
                .unwrap_or(0.0)
        } else {
            sqlx::query_scalar::<_, f64>("SELECT total_value_tl FROM portfolio_snapshots ORDER BY snapshot_date DESC LIMIT 1")
                .fetch_optional(pool)
                .await?
                .unwrap_or(0.0)
        };

        // Get start value
        let start_val: f64 = if let Some(start) = &start_date {
            sqlx::query_scalar::<_, f64>("SELECT total_value_tl FROM portfolio_snapshots WHERE snapshot_date <= ? ORDER BY snapshot_date DESC LIMIT 1")
                .bind(start)
                .fetch_optional(pool)
                .await?
                .unwrap_or(0.0)
        } else {
            0.0
        };

        if start_val > 0.0 {
            let diff = end_val - start_val;
            let pct = (diff / start_val) * 100.0;
            return Ok((diff, pct));
        }

        Ok((0.0, 0.0))
    }
}

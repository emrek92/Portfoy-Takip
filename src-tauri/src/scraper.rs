use scraper::{Html, Selector};
use sqlx::SqlitePool;
use chrono::Local;
use std::sync::Arc;
use futures::future::join_all;

pub struct ScraperService {
    client: reqwest::Client,
}

impl ScraperService {
    pub fn new() -> Self {
        let headers = {
            let mut h = reqwest::header::HeaderMap::new();
            h.insert("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".parse().unwrap());
            h
        };
        Self {
            client: reqwest::Client::builder()
                .default_headers(headers)
                .build()
                .unwrap(),
        }
    }

    pub async fn update_general_assets(&self, pool: &SqlitePool, force: bool) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if !force {
            if let Ok(Some(last_str)) = sqlx::query_scalar::<_, Option<String>>(
                "SELECT MAX(last_updated) FROM assets WHERE asset_type IN ('doviz', 'emtia', 'hisse', 'kripto')"
            ).fetch_optional(pool).await {
                if let Some(last_updated) = last_str {
                    if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(&last_updated) {
                         // 15 mins cache for general assets
                        if (Local::now() - dt.with_timezone(&Local)).num_minutes() < 15 {
                             return Ok(());
                        }
                    }
                }
            }
        }

        let urls = vec![
            ("https://canlidoviz.com/doviz-kurlari", "doviz"),
            ("https://canlidoviz.com/altin-fiyatlari", "emtia"),
            ("https://canlidoviz.com/borsa", "hisse"),
            ("https://canlidoviz.com/kripto-paralar", "kripto"),
        ];

        // Fetch concurrently
        let futures = urls.into_iter().map(|(url, asset_type)| {
            let client = self.client.clone();
            async move {
                match client.get(url).send().await {
                    Ok(resp) => match resp.text().await {
                        Ok(text) => Some((text, asset_type)),
                        Err(_) => None,
                    },
                    Err(_) => None,
                }
            }
        });

        let results = join_all(futures).await;
        let mut all_assets = Vec::new();

        for result in results.into_iter().flatten() {
            let (res, asset_type) = result;
            
            // Parsing Logic (same as before but optimized extraction)
            let document = Html::parse_document(&res);
            let row_selector = Selector::parse("tr.currency-list-row, tr.table-row-md").unwrap();
            let name_selector = Selector::parse("span[itemprop='name'], span.truncate.text-theme.text-base").unwrap();
            let price_selector = Selector::parse("span[dt='bA'], span[dt='amount']").unwrap();
            let code_selector = Selector::parse("span[itemprop='currency'], span.table-code, span.code").unwrap();
            let perc_selector = Selector::parse("span[dt='change'], span[dt='perc'], span[dt='p'], span.table-perc, span.currency-change-text").unwrap();

            for row in document.select(&row_selector) {
                let name = row.select(&name_selector).next().map(|e| e.text().collect::<String>().trim().to_string());
                let price_text = row.select(&price_selector).next().map(|e| e.text().collect::<String>());
                let mut symbol = row.select(&code_selector).next().map(|e| e.text().collect::<String>().trim().to_string());
                let perc_text = row.select(&perc_selector).next().map(|e| e.text().collect::<String>());

                if let (Some(n), Some(p_t)) = (name, price_text) {
                    if symbol.is_none() || symbol.as_ref().unwrap().is_empty() {
                         // Try to generate symbol from name if missing
                        let generated = n.chars()
                             .filter(|c| c.is_alphanumeric())
                             .take(5)
                             .collect::<String>()
                             .to_uppercase();
                        symbol = Some(generated);
                    }
                    
                    let mut sym = symbol.unwrap();
                    if asset_type == "kripto" {
                        sym = format!("{}-C", sym); // Only keeping -C for consistency if needed
                    }
                    // Fix: Remove redundant suffix if present
                    if sym.ends_with("-C-C") {
                         sym = sym.replace("-C-C", "-C");
                    }

                    // Optimized price parsing
                    let clean_price = p_t.chars().filter(|c| c.is_digit(10) || *c == ',' || *c == '.').collect::<String>();
                    let price = self.parse_tr_float(&clean_price).unwrap_or(0.0);
                    
                    let day_change = if let Some(pt) = perc_text {
                        let clean_perc = pt.chars().filter(|c| c.is_digit(10) || *c == ',' || *c == '.' || *c == '-' || *c == '+').collect::<String>();
                        self.parse_tr_float(&clean_perc).unwrap_or(0.0)
                    } else {
                        0.0
                    };

                    if price > 0.0 {
                        all_assets.push((sym, n, asset_type.to_string(), price, day_change));
                    }
                }
            }
        }

        if all_assets.is_empty() {
            return Ok(());
        }

        // Batch Insert with Transaction
        let mut tx = pool.begin().await?;
        let last_updated = Local::now().to_rfc3339();

        for (symbol, name, a_type, price, day_change) in all_assets {
            sqlx::query(
                "INSERT INTO assets (symbol, name, asset_type, current_price, day_change, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(symbol) DO UPDATE SET
                    current_price = excluded.current_price,
                    day_change = excluded.day_change,
                    last_updated = excluded.last_updated"
            )
            .bind(symbol)
            .bind(name)
            .bind(a_type)
            .bind(price)
            .bind(day_change)
            .bind(&last_updated)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        
        Ok(())
    }

    pub async fn update_tefas_funds(&self, pool: &SqlitePool, force: bool) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if !force {
             if let Ok(Some(last_str)) = sqlx::query_scalar::<_, Option<String>>(
                "SELECT MAX(last_updated) FROM assets WHERE asset_type = 'fon'"
            ).fetch_optional(pool).await {
                if let Some(last_updated) = last_str {
                    if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(&last_updated) {
                         // 4 hours cache for funds
                        if (Local::now() - dt.with_timezone(&Local)).num_hours() < 4 {
                            return Ok(());
                        }
                    }
                }
            }
        }
        
        let base_url = "https://www.tefas.gov.tr/api/DB/BindHistoryInfo";
        let fund_types = vec!["YAT", "EMK", "BYF", "GYF", "GSYF"];
        
        // Find valid date concurrently? No, date dependency exists. 
        // We need to find the latest valid date first.
        // But checking 5 days is fast if we do it right. 
        // Let's assume today or yesterday is valid and try to fetch in parallel.
        
        // Strategy: fetch all fund types for calculated date
        // Try today, if empty try yesterday, etc.
        
        let mut valid_date_str = String::new();
        let mut funds_data = Vec::new();

        for i in 0..5 {
            let target_dt = Local::now() - chrono::Duration::days(i);
            // Skip weekends: Sat=6, Sun=7. format %u
            if target_dt.format("%u").to_string().parse::<u8>().unwrap() > 5 { continue; }
            
            let date_str = target_dt.format("%d.%m.%Y").to_string();
            
            // Check just one type to verify date validity quickly
            let params = [("fontip", "YAT"), ("bastarih", &date_str), ("bittarih", &date_str)];
            if let Ok(res) = self.client.post(base_url).form(&params).send().await {
                 if let Ok(json) = res.json::<serde_json::Value>().await {
                     if let Some(data) = json["data"].as_array() {
                         if !data.is_empty() {
                             valid_date_str = date_str;
                             // We found data for YAT, add it
                             funds_data.push(json); 
                             break;
                         }
                     }
                 }
            }
        }

        if valid_date_str.is_empty() {
            return Ok(());
        }

        // Now fetch other types concurrently for this valid date
        let remaining_types = fund_types.into_iter().filter(|&t| t != "YAT").collect::<Vec<_>>();
        
        let futures = remaining_types.into_iter().map(|f_type| {
            let client = self.client.clone();
            let d_str = valid_date_str.clone();
            async move {
                let params = [("fontip", f_type), ("bastarih", &d_str), ("bittarih", &d_str)];
                match client.post("https://www.tefas.gov.tr/api/DB/BindHistoryInfo").form(&params).send().await {
                    Ok(res) => res.json::<serde_json::Value>().await.ok(),
                    Err(_) => None,
                }
            }
        });

        let results = join_all(futures).await;
        for res in results.into_iter().flatten() {
            funds_data.push(res);
        }

        // Process all funds
        let mut all_funds = Vec::new();
        
        for json in funds_data {
             if let Some(funds) = json["data"].as_array() {
                for fund in funds {
                    let symbol = fund["FONKODU"].as_str().unwrap_or("").to_uppercase();
                    let name = fund["FONUNVAN"].as_str().unwrap_or("").to_string();
                    let price_raw = fund["FIYAT"].as_f64()
                        .or_else(|| fund["SONFIYAT"].as_f64())
                        .or_else(|| fund["BORSABULTENFIYAT"].as_f64());
                    
                    let day_change = fund["GUNLUKGETIRI"].as_f64().unwrap_or(0.0);

                    if let Some(price) = price_raw {
                        if price > 0.0 {
                            all_funds.push((symbol, name, price, day_change));
                        }
                    }
                }
            }
        }

        if all_funds.is_empty() {
            return Ok(());
        }

        // Bulk Insert with Transaction
        let mut tx = pool.begin().await?;
        let last_updated = Local::now().to_rfc3339();

        for (symbol, name, price, day_change) in all_funds {
            sqlx::query(
                "INSERT INTO assets (symbol, name, asset_type, current_price, day_change, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(symbol) DO UPDATE SET
                    current_price = excluded.current_price,
                    day_change = excluded.day_change,
                    last_updated = excluded.last_updated"
            )
            .bind(symbol)
            .bind(name)
            .bind("fon")
            .bind(price)
            .bind(day_change)
            .bind(&last_updated)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;

        Ok(())
    }

    fn parse_tr_float(&self, val: &str) -> Option<f64> {
        let clean = val.trim();
        if clean.contains(',') && clean.contains('.') {
            if clean.rfind(',') > clean.rfind('.') {
                clean.replace('.', "").replace(',', ".").parse().ok()
            } else {
                clean.replace(',', "").parse().ok()
            }
        } else if clean.contains(',') {
            clean.replace(',', ".").parse().ok()
        } else {
            clean.parse().ok()
        }
    }
}

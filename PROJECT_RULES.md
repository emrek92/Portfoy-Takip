# Portföy Yönetimi - Proje Kuralları

## 1. Proje Genel Bakış

**Portföy Yönetimi**, profesyonel yatırım portföyü takip ve analiz uygulamasıdır. Tauri + React + Rust teknoloji stack'i kullanılarak geliştirilmiştir.

### Temel Özellikler
- 📊 Portföy Takibi: TEFAS fonları, hisse senetleri, döviz, kripto ve emtia
- 📈 Performans Analizi: Günlük, haftalık, aylık ve yıllık getiri hesaplamaları
- 💰 Gerçek Zamanlı Fiyatlar: Otomatik piyasa verisi güncelleme
- 📋 İşlem Geçmişi: Detaylı alım/satım kayıtları
- 🎨 Modern Arayüz: Karanlık tema, animasyonlar ve responsive tasarım

---

## 2. Teknoloji Stack

### Frontend
- **React 19** - UI Framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animasyonlar
- **Zustand** - State yönetimi
- **Recharts** - Grafikler
- **Lucide React** - İkonlar

### Backend (Rust/Tauri)
- **Tauri 2** - Desktop framework
- **SQLx** - SQLite ORM
- **Reqwest** - HTTP client
- **Tokio** - Async runtime
- **Chrono** - Tarih/zaman işlemleri
- **Serde** - Serialization

### Veritabanı
- **SQLite** - Yerel veritabanı

### API
- **BorsaPy API** - Piyasa verileri (`https://borsapy-api.onrender.com`)

---

## 3. Proje Yapısı

```
portfoy-takip/
├── src/                          # React Frontend
│   ├── components/               # UI Bileşenleri
│   │   ├── ui/                   # Temel UI bileşenleri
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── layout/               # Layout bileşenleri
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── index.ts
│   │   ├── AddTransactionModal.tsx
│   │   └── GlassCard.tsx
│   ├── pages/                    # Sayfalar
│   │   ├── PortfolioPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── AssetDetailPage.tsx
│   │   └── index.ts
│   ├── store/                    # State yönetimi
│   │   └── useStore.ts           # Zustand store
│   ├── hooks/                    # Custom hooks
│   │   ├── useTheme.ts
│   │   └── useTheme.test.ts
│   ├── lib/                      # Yardımcı fonksiyonlar
│   │   ├── utils.ts
│   │   └── utils.test.ts
│   ├── stories/                  # Storybook stories
│   ├── test/                     # Test setup
│   ├── index.css                 # Global styles
│   ├── main.tsx                  # Entry point
│   └── App.tsx                   # Main App component
├── src-tauri/                    # Rust Backend
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── lib.rs                # Tauri commands & app state
│   │   ├── db.rs                 # Database initialization
│   │   ├── calculator.rs         # FIFO & KPI calculations
│   │   ├── market.rs             # Market data service
│   │   └── api_client.rs         # BorsaPy API client
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/                       # Static assets
├── package.json
├── index.html
└── README.md
```

---

## 4. Mimari Kuralları

### 4.1 Frontend Kuralları

#### Component Yapısı
- Bileşenler `PascalCase` ile adlandırılır
- Her bileşen kendi klasöründe veya `ui/`, `layout/` altında olur
- Props interface'leri açıkça tanımlanır
- `memo` kullanımı gerektiğinde optimize edilir

#### State Yönetimi
- Global state Zustand ile yönetilir
- Local state `useState` ile yönetilir
- Async işlemler store içinde yapılır

#### Styling Kuralları
- Tailwind CSS kullanılır
- CSS değişkenleri tema yönetimi için kullanılır
- `cn()` utility fonksiyonu class birleştirme için kullanılır
- Light/Dark tema desteği zorunludur

### 4.2 Backend (Rust) Kuralları

#### Modül Yapısı
- Her modül ayrı dosyada (`db.rs`, `calculator.rs`, etc.)
- Public fonksiyonlar `pub` ile işaretlenir
- Error handling `Result<T, E>` ile yapılır

#### Tauri Commands
- Tüm komutlar `#[tauri::command]` ile işaretlenir
- Async komutlar `async fn` olarak tanımlanır
- State erişimi `State<'_, AppState>` ile yapılır
- Error mesajları `String` olarak döndürülür

#### Veritabanı Kuralları
- SQLx ile compile-time checked queries
- Migration logic `db.rs` içinde
- Tablo şemaları `init_db()` fonksiyonunda tanımlı

---

## 5. Veritabanı Şeması

### Tables

#### transactions
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_date DATE NOT NULL,
    asset_type TEXT NOT NULL,        -- fon, hisse, kripto, doviz, emtia, endeks
    symbol TEXT NOT NULL,            -- Varlık sembolü (örn: USD, BTC, GARAN)
    transaction_type TEXT NOT NULL,  -- BUY, SELL
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    total_value REAL,
    fees REAL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    broker TEXT,
    notes TEXT,
    is_dividend BOOLEAN DEFAULT 0
);
```

#### assets
```sql
CREATE TABLE assets (
    symbol TEXT PRIMARY KEY,
    name TEXT,
    asset_type TEXT,                 -- fon, hisse, kripto, doviz, emtia, endeks
    current_price REAL,
    day_change REAL DEFAULT 0,
    last_updated TIMESTAMP,
    market TEXT,
    sector TEXT
);
```

#### portfolio_snapshots
```sql
CREATE TABLE portfolio_snapshots (
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
);
```

#### asset_price_history
```sql
CREATE TABLE asset_price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT,
    price REAL,
    snapshot_date DATE,
    UNIQUE(symbol, snapshot_date)
);
```

#### tefas_daily_tracking
```sql
CREATE TABLE tefas_daily_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT,
    price REAL,
    day_change REAL,
    snapshot_date DATE,
    UNIQUE(symbol, snapshot_date)
);
```

---

## 6. API Endpoints (BorsaPy)

### Temel URL
```
https://borsapy-api.onrender.com
```

### Endpoint'ler

| Asset Tipi | Endpoint | Response |
|------------|----------|----------|
| Hisse (`hisse`) | `/stocks/{symbol}/info` | `{ last, change_percent, description }` |
| Endeks (`endeks`) | `/indices/{symbol}/info` | `{ last, change_percent, description }` |
| Kripto (`kripto`) | `/crypto/{symbol}/current` | `{ current: { last, open } }` |
| Fon (`fon`) | `/funds/{code}/info` | `{ price, daily_return, name }` |
| Döviz (`doviz`) | `/fx/{symbol}/current` | `{ current: { last, open } }` |

### Fon Detay Endpoint'leri
| Endpoint | Açıklama |
|----------|----------|
| `/funds/{code}/performance` | Fon performans metrikleri |
| `/funds/{code}/risk?period=1y` | Risk metrikleri |
| `/funds/{code}/history?period=1y` | Fiyat geçmişi |

---

## 7. Tauri Commands

### Portföy Komutları
- `get_summary()` - Portföy özetini getirir
- `get_holdings()` - Mevcut pozisyonları getirir
- `get_transactions()` - İşlem geçmişini getirir
- `add_transaction()` - Yeni işlem ekle
- `update_transaction()` - İşlem güncelle
- `delete_transaction()` - İşlem sil

### Market Verisi Komutları
- `update_market_data(update_type, force)` - Piyasa verilerini güncelle
  - `update_type`: "general" | "tefas" | "all"
  - `force`: Cache'i bypass et

### Fon Detay Komutları
- `get_fund_performance(code)` - Fon performansı
- `get_fund_risk(code)` - Risk metrikleri
- `get_fund_history(code)` - Fiyat geçmişi

### Veritabanı Komutları
- `migrate_database(source_path)` - Eski DB'den migrasyon
- `clear_database()` - Tüm verileri temizle
- `export_database_json()` - JSON olarak export
- `import_database_json(json_data)` - JSON'dan import

### Yardımcı Komutlar
- `get_asset_info(symbol)` - Varlık bilgisi
- `get_last_updates()` - Son güncelleme zamanları
- `get_realized_pnl_in_range(start_date, end_date)` - Dönemsel realized PnL
- `get_range_performance(start_date, end_date)` - Dönemsel performans

---

## 8. Asset Tipleri

| Tip | Kod | Açıklama |
|-----|-----|----------|
| Fon | `fon` | TEFAS yatırım fonları |
| Hisse | `hisse` | BIST hisse senetleri |
| Kripto | `kripto` | Kripto paralar |
| Döviz | `doviz` | Döviz kurları (USD, EUR) |
| Emtia | `emtia` | Emtia fiyatları |
| Endeks | `endeks` | BIST endeksleri (XU100) |

---

## 9. FIFO Hesaplama Mantığı

1. İşlemler tarih sırasına göre işlenir
2. Alım işlemleri kuyruğa eklenir
3. Satım işlemleri kuyruktan düşürülür
4. Realized PnL satım anında hesaplanır:
   ```
   realized_pnl = (satış_fiyatı - alış_fiyatı) * miktar
   ```
5. Kalan miktarlar mevcut pozisyonları oluşturur

---

## 10. Tema Sistemi

### CSS Değişkenleri

#### Light Theme
```css
--color-bg-primary: #eaebef;
--color-bg-secondary: #ffffff;
--color-bg-tertiary: #dce1e8;
--color-accent-blue: #3b82f6;
--color-accent-green: #15803d;
--color-accent-red: #b91c1c;
--color-accent-gold: #b45309;
--color-text-primary: #111827;
--color-text-secondary: #374151;
```

#### Dark Theme
```css
--color-bg-primary: #111827;
--color-bg-secondary: #1f2937;
--color-bg-tertiary: #374151;
--color-accent-blue: #60a5fa;
--color-accent-green: #34d399;
--color-accent-red: #f87171;
--color-accent-gold: #fbbf24;
--color-text-primary: #f3f4f6;
--color-text-secondary: #9ca3af;
```

---

## 11. Geliştirme Kuralları

### Kod Stili
- TypeScript: Strict mode aktif
- Rust: `cargo fmt` ve `cargo clippy` kullanımı
- ESLint ve Prettier konfigürasyonuna uyma

### Commit Mesajları
- Türkçe veya İngilizce kullanılabilir
- Anlamlı ve açıklayıcı olmalı
- Örnek: `feat: Add transaction modal`, `fix: FIFO calculation bug`

### Testing
- Unit testler `*.test.ts` dosyalarında
- Component testleri Storybook ile
- Test coverage'ı koruma

---

## 12. Build & Deploy

### Geliştirme
```bash
npm install
npm run tauri dev
```

### Production Build
```bash
npm run tauri build
```

### Storybook
```bash
npm run storybook
```

---

## 13. Ortam Değişkenleri

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `BORSAPY_API_URL` | BorsaPy API URL | `https://borsapy-api.onrender.com` |

---

## 14. Cache Stratejisi

| Asset Tipi | Cache Süresi |
|------------|--------------|
| Döviz (USD, EUR) | 15 dakika |
| Hisse | 15 dakika |
| Kripto | 15 dakika |
| Fon (TEFAS) | 4 saat |

---

## 15. Hata Yönetimi

### Frontend
- Tauri invoke hataları `try-catch` ile yakalanır
- Kullanıcıya toast/notification gösterilir
- Console'a detaylı log yazılır

### Backend
- Tüm fonksiyonlar `Result<T, String>` döndürür
- SQLx hataları `.map_err(|e| e.to_string())` ile dönüştürülür
- API hataları loglanır ve kullanıcıya iletilir

---

## 16. Güvenlik

- CSP (Content Security Policy) yapılandırılmış
- SQL injection koruması (SQLx parametrik queries)
- XSS koruması (React otomatik escape)
- Local file system access sadece gerekli yerlerde

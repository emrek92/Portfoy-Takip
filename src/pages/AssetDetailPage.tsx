import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Calendar,
    DollarSign,
    BarChart3,
    PieChart,
    AlertTriangle,
    Newspaper,
    Users,
    Loader2,
    ExternalLink,
    Activity,
    Clock,
    Target,
    Shield
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { cn, formatCurrency, formatPercentage } from '../lib/utils';
import type { Holding } from '../store/useStore';

const API_BASE = 'https://borsapy-api.onrender.com';

interface AssetDetailPageProps {
    holding: Holding;
    onBack: () => void;
}

interface HistoryData {
    date: string;
    close: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
}

interface FundPerformance {
    daily_return?: number;
    return_1m?: number;
    return_3m?: number;
    return_6m?: number;
    return_1y?: number;
    return_3y?: number;
    return_5y?: number;
    return_ytd?: number;
}

interface FundRisk {
    annualized_volatility?: number;
    sharpe_ratio?: number;
    sortino_ratio?: number;
    max_drawdown?: number;
    beta?: number;
    alpha?: number;
}

interface StockInfo {
    last?: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
    market_cap?: number;
    pe_ratio?: number;
    pb_ratio?: number;
    dividend_yield?: number;
    fifty_two_week_high?: number;
    fifty_two_week_low?: number;
    description?: string;
    sector?: string;
    industry?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.2 },
    },
};

// Simple sparkline chart component
const Sparkline = memo<{ data: number[]; positive: boolean }>(({ data, positive }) => {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 200;
    const height = 60;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                fill="none"
                stroke={positive ? '#10b981' : '#f43f5e'}
                strokeWidth="2"
                points={points}
            />
        </svg>
    );
});

Sparkline.displayName = 'Sparkline';

const StatCard = memo<{
    label: string;
    value: string;
    subtitle?: string;
    icon?: React.ElementType;
    variant?: 'default' | 'positive' | 'negative' | 'warning';
}>(({ label, value, subtitle, icon: Icon, variant = 'default' }) => {
    const variantClasses = {
        default: 'text-[var(--color-text-primary)]',
        positive: 'text-emerald-500',
        negative: 'text-rose-500',
        warning: 'text-amber-500',
    };

    return (
        <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)]/50">
            <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon size={12} className="text-[var(--color-text-secondary)]" />}
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    {label}
                </span>
            </div>
            <p className={cn('text-lg font-bold font-mono', variantClasses[variant])}>
                {value}
            </p>
            {subtitle && (
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>
            )}
        </div>
    );
});

StatCard.displayName = 'StatCard';

const AssetDetailPage = memo<AssetDetailPageProps>(({ holding, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [performance, setPerformance] = useState<FundPerformance | null>(null);
    const [riskData, setRiskData] = useState<FundRisk | null>(null);
    const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    const normalizedType = holding.asset_type.toLowerCase().trim();
    const isStock = normalizedType === 'hisse' || normalizedType === 'stock';
    const isFund = normalizedType === 'fon' || normalizedType === 'fund' || normalizedType === 'yatırım fonu';
    const isFx = normalizedType === 'doviz' || normalizedType === 'emtia' || normalizedType === 'fx' || normalizedType === 'gold';
    const isCrypto = normalizedType === 'kripto' || normalizedType === 'crypto' || normalizedType === 'coin';
    const isIndex = normalizedType === 'endeks' || normalizedType === 'index';

    // Clean symbol (remove validation chars if any, though usually trusted)
    const cleanSymbol = holding.symbol.trim().toUpperCase();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Determine fetch strategy based on asset type

                // --- FUNDS (Use Backend Proxy for reliability) ---
                if (isFund) {
                    console.log(`[DETAIL] Fetching fund details for ${cleanSymbol} via Backend...`);

                    // 1. History
                    try {
                        const historyPoints = await invoke<HistoryData[]>('get_fund_history', { code: cleanSymbol });
                        console.log('[DETAIL] Fund history fetched:', historyPoints.length, 'points');
                        setHistoryData(historyPoints);
                    } catch (e: any) {
                        console.error('[DETAIL] Fund history backend error:', e);
                        // Don't set global error, allow partial data
                    }

                    // 2. Performance
                    try {
                        const perf = await invoke<FundPerformance>('get_fund_performance', { code: cleanSymbol });
                        console.log('[DETAIL] Fund performance fetched');
                        setPerformance(perf);
                    } catch (e: any) {
                        console.error('[DETAIL] Fund performance backend error:', e);
                    }

                    // 3. Risk
                    try {
                        const risk = await invoke<FundRisk>('get_fund_risk', { code: cleanSymbol });
                        console.log('[DETAIL] Fund risk fetched');
                        setRiskData(risk);
                    } catch (e: any) {
                        console.error('[DETAIL] Fund risk backend error:', e);
                    }
                }

                // --- OTHER ASSETS (Use Direct Fetch for now) ---
                else {
                    let historyUrl = '';
                    if (isStock) {
                        historyUrl = `${API_BASE}/stocks/${cleanSymbol}/history?period=1y&interval=1d`;
                    } else if (isFx) {
                        historyUrl = `${API_BASE}/fx/${cleanSymbol}/history?period=1y&interval=1d`;
                    } else if (isCrypto) {
                        const cryptoSymbol = cleanSymbol.endsWith('TRY') ? cleanSymbol : `${cleanSymbol}TRY`;
                        historyUrl = `${API_BASE}/crypto/${cryptoSymbol}/history?period=1y`;
                    } else if (isIndex) {
                        historyUrl = `${API_BASE}/indices/${cleanSymbol}/history?period=1y`;
                    }

                    if (historyUrl) {
                        console.log('[DETAIL] Fetching history (Direct):', historyUrl);
                        try {
                            const historyResp = await fetch(historyUrl);
                            if (!historyResp.ok) throw new Error(`History fetch failed: ${historyResp.status}`);

                            const data = await historyResp.json();
                            // Handle different response formats
                            if (Array.isArray(data)) {
                                setHistoryData(data);
                            } else if (data.data && Array.isArray(data.data)) {
                                setHistoryData(data.data);
                            } else if (typeof data === 'object') {
                                // Convert object to array format
                                const entries = Object.entries(data).map(([date, values]: [string, any]) => ({
                                    date,
                                    close: values.Close || values.close || values.price || 0,
                                    open: values.Open || values.open,
                                    high: values.High || values.high,
                                    low: values.Low || values.low,
                                    volume: values.Volume || values.volume,
                                }));
                                setHistoryData(entries);
                            }
                        } catch (histErr) {
                            console.error('[DETAIL] History fetch error:', histErr);
                        }
                    }

                    // Stock Info
                    if (isStock) {
                        try {
                            const infoResp = await fetch(`${API_BASE}/stocks/${cleanSymbol}/info`);
                            if (infoResp.ok) {
                                const info = await infoResp.json();
                                setStockInfo(info);
                            }
                        } catch (e) { console.error('Stock info error:', e); }
                    }
                }

            } catch (err) {
                console.error('[DETAIL] General error:', err);
                setError('Veri yüklenirken hata oluştu: ' + (err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [holding.symbol, holding.asset_type, isStock, isFund, isFx, isCrypto, isIndex, cleanSymbol]);

    // Calculate price change from history
    const priceChanges = React.useMemo(() => {
        if (historyData.length < 2) return null;

        const current = historyData[historyData.length - 1]?.close || 0;
        const weekAgo = historyData[Math.max(0, historyData.length - 7)]?.close || current;
        const monthAgo = historyData[Math.max(0, historyData.length - 30)]?.close || current;
        const threeMonthAgo = historyData[Math.max(0, historyData.length - 90)]?.close || current;
        const sixMonthAgo = historyData[Math.max(0, historyData.length - 180)]?.close || current;
        const yearStart = historyData[0]?.close || current;

        // If it's a fund, we might prefer API provided performance data if available
        return {
            weekly: weekAgo > 0 ? ((current - weekAgo) / weekAgo) * 100 : 0,
            monthly: monthAgo > 0 ? ((current - monthAgo) / monthAgo) * 100 : 0,
            threeMonth: threeMonthAgo > 0 ? ((current - threeMonthAgo) / threeMonthAgo) * 100 : 0,
            sixMonth: sixMonthAgo > 0 ? ((current - sixMonthAgo) / sixMonthAgo) * 100 : 0,
            yearly: yearStart > 0 ? ((current - yearStart) / yearStart) * 100 : 0,
        };
    }, [historyData]);

    const sparklineData = historyData.map(d => d.close).filter(v => v > 0);
    // Use fund performance for color if available, else calc
    const isPositive = isFund && performance?.return_1y !== undefined
        ? performance.return_1y >= 0
        : (priceChanges ? priceChanges.yearly >= 0 : holding.pnl_pct >= 0);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 max-w-[1400px] mx-auto pb-10"
        >
            {/* Back Button & Header */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        leftIcon={<ArrowLeft size={16} />}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    >
                        Portföye Dön
                    </Button>
                </div>

                <Card variant="glass" className="p-6 bg-gradient-to-br from-sky-500/10 via-transparent to-emerald-500/10 border-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                'w-16 h-16 flex items-center justify-center rounded-2xl text-xl font-bold',
                                isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                            )}>
                                {holding.symbol.slice(0, 3)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                    {holding.symbol}
                                </h1>
                                <p className="text-sm text-[var(--color-text-secondary)]">{holding.name}</p>
                                <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold uppercase tracking-wider rounded bg-sky-500/10 text-sky-400">
                                    {holding.asset_type}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <p className="text-3xl font-bold font-mono text-[var(--color-text-primary)]">
                                {formatCurrency(holding.current_price)}
                            </p>
                            <div className={cn(
                                'flex items-center gap-1 text-lg font-bold font-mono',
                                isPositive ? 'text-emerald-500' : 'text-rose-500'
                            )}>
                                {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                {formatPercentage(holding.pnl_pct)}
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Loading State */}
            {loading && (
                <motion.div variants={itemVariants} className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-sky-500" />
                    <span className="ml-3 text-[var(--color-text-secondary)]">Veri yükleniyor...</span>
                </motion.div>
            )}

            {/* Error State */}
            {error && !loading && (
                <motion.div variants={itemVariants}>
                    <Card variant="glass" className="p-6 bg-rose-500/5 border-rose-500/20">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-rose-500" />
                            <p className="text-rose-500">{error}</p>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Content */}
            {!loading && !error && (
                <>
                    {/* Price Chart Section */}
                    <motion.div variants={itemVariants}>
                        <Card variant="glass">
                            <CardHeader title="📈 Fiyat Grafiği" subtitle={isFund ? "Son 1 yıl" : `${historyData.length} günlük veri`} />
                            <CardContent>
                                {sparklineData.length > 0 ? (
                                    <div className="flex flex-col items-center py-4">
                                        <div className="w-full max-w-lg">
                                            <Sparkline data={sparklineData} positive={isPositive} />
                                        </div>
                                        <div className="flex gap-4 mt-4 text-xs text-[var(--color-text-secondary)]">
                                            <span>Min: {formatCurrency(Math.min(...sparklineData))}</span>
                                            <span>Max: {formatCurrency(Math.max(...sparklineData))}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-[var(--color-text-secondary)] py-8">
                                        Grafik verisi bulunamadı
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Performance Stats - For Funds we use API data, for others we calc from history */}
                    {isFund && performance ? (
                        <motion.div variants={itemVariants}>
                            <Card variant="glass">
                                <CardHeader title="📊 Fon Performansı" subtitle="TEFAS resmi verileri" />
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                        {performance.daily_return !== undefined && (
                                            <StatCard label="Günlük" value={formatPercentage(performance.daily_return)} variant={performance.daily_return >= 0 ? 'positive' : 'negative'} />
                                        )}
                                        {performance.return_1m !== undefined && (
                                            <StatCard label="1 Ay" value={formatPercentage(performance.return_1m)} variant={performance.return_1m >= 0 ? 'positive' : 'negative'} />
                                        )}
                                        {performance.return_3m !== undefined && (
                                            <StatCard label="3 Ay" value={formatPercentage(performance.return_3m)} variant={performance.return_3m >= 0 ? 'positive' : 'negative'} />
                                        )}
                                        {performance.return_6m !== undefined && (
                                            <StatCard label="6 Ay" value={formatPercentage(performance.return_6m)} variant={performance.return_6m >= 0 ? 'positive' : 'negative'} />
                                        )}
                                        {performance.return_1y !== undefined && (
                                            <StatCard label="1 Yıl" value={formatPercentage(performance.return_1y)} variant={performance.return_1y >= 0 ? 'positive' : 'negative'} />
                                        )}
                                        {performance.return_3y !== undefined && (
                                            <StatCard label="3 Yıl" value={formatPercentage(performance.return_3y)} variant={performance.return_3y >= 0 ? 'positive' : 'negative'} />
                                        )}
                                        {performance.return_5y !== undefined && (
                                            <StatCard label="5 Yıl" value={formatPercentage(performance.return_5y)} variant={performance.return_5y >= 0 ? 'positive' : 'negative'} />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        // Calculated performance for non-funds
                        priceChanges && (
                            <motion.div variants={itemVariants}>
                                <Card variant="glass">
                                    <CardHeader title="📊 Performans" subtitle="Dönemsel getiri oranları" />
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            <StatCard
                                                label="Haftalık"
                                                value={formatPercentage(priceChanges.weekly)}
                                                icon={Clock}
                                                variant={priceChanges.weekly >= 0 ? 'positive' : 'negative'}
                                            />
                                            <StatCard
                                                label="Aylık"
                                                value={formatPercentage(priceChanges.monthly)}
                                                icon={Calendar}
                                                variant={priceChanges.monthly >= 0 ? 'positive' : 'negative'}
                                            />
                                            <StatCard
                                                label="3 Aylık"
                                                value={formatPercentage(priceChanges.threeMonth)}
                                                icon={BarChart3}
                                                variant={priceChanges.threeMonth >= 0 ? 'positive' : 'negative'}
                                            />
                                            <StatCard
                                                label="6 Aylık"
                                                value={formatPercentage(priceChanges.sixMonth)}
                                                icon={Activity}
                                                variant={priceChanges.sixMonth >= 0 ? 'positive' : 'negative'}
                                            />
                                            <StatCard
                                                label="Yıllık"
                                                value={formatPercentage(priceChanges.yearly)}
                                                icon={TrendingUp}
                                                variant={priceChanges.yearly >= 0 ? 'positive' : 'negative'}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    )}

                    {/* Portfolio Stats */}
                    <motion.div variants={itemVariants}>
                        <Card variant="glass">
                            <CardHeader title="💼 Portföy Bilgileri" subtitle="Bu varlıktaki pozisyonunuz" />
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <StatCard
                                        label="Adet"
                                        value={holding.quantity.toLocaleString('tr-TR', { maximumFractionDigits: 4 })}
                                        icon={Target}
                                    />
                                    <StatCard
                                        label="Ortalama Maliyet"
                                        value={formatCurrency(holding.avg_cost)}
                                        icon={DollarSign}
                                    />
                                    <StatCard
                                        label="Toplam Değer"
                                        value={formatCurrency(holding.value)}
                                        icon={PieChart}
                                    />
                                    <StatCard
                                        label="Kar/Zarar"
                                        value={formatCurrency(holding.pnl)}
                                        subtitle={formatPercentage(holding.pnl_pct)}
                                        icon={TrendingUp}
                                        variant={holding.pnl >= 0 ? 'positive' : 'negative'}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Stock-specific info */}
                    {isStock && stockInfo && (
                        <motion.div variants={itemVariants}>
                            <Card variant="glass">
                                <CardHeader title="🏢 Hisse Bilgileri" subtitle="Temel analiz verileri" />
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {stockInfo.market_cap && (
                                            <StatCard
                                                label="Piyasa Değeri"
                                                value={formatCurrency(stockInfo.market_cap)}
                                                icon={DollarSign}
                                            />
                                        )}
                                        {stockInfo.pe_ratio && (
                                            <StatCard
                                                label="F/K Oranı"
                                                value={stockInfo.pe_ratio.toFixed(2)}
                                                icon={BarChart3}
                                            />
                                        )}
                                        {stockInfo.dividend_yield && (
                                            <StatCard
                                                label="Temettü Verimi"
                                                value={formatPercentage(stockInfo.dividend_yield)}
                                                icon={Target}
                                            />
                                        )}
                                        {stockInfo.fifty_two_week_high && (
                                            <StatCard
                                                label="52 Hafta Max"
                                                value={formatCurrency(stockInfo.fifty_two_week_high)}
                                                icon={TrendingUp}
                                            />
                                        )}
                                    </div>
                                    {stockInfo.sector && (
                                        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                                            <span className="font-bold">Sektör:</span> {stockInfo.sector}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Fund Risk Metrics */}
                    {isFund && riskData && (
                        <motion.div variants={itemVariants}>
                            <Card variant="glass">
                                <CardHeader title="⚠️ Risk Metrikleri" subtitle="1 yıllık risk analizi" />
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {riskData.annualized_volatility !== undefined && (
                                            <StatCard
                                                label="Volatilite"
                                                value={formatPercentage(riskData.annualized_volatility)}
                                                icon={Activity}
                                                variant="warning"
                                            />
                                        )}
                                        {riskData.sharpe_ratio !== undefined && (
                                            <StatCard
                                                label="Sharpe Oranı"
                                                value={riskData.sharpe_ratio.toFixed(2)}
                                                icon={Shield}
                                            />
                                        )}
                                        {riskData.max_drawdown !== undefined && (
                                            <StatCard
                                                label="Maks Düşüş"
                                                value={formatPercentage(riskData.max_drawdown)}
                                                icon={TrendingDown}
                                                variant="negative"
                                            />
                                        )}
                                        {riskData.beta !== undefined && (
                                            <StatCard
                                                label="Beta"
                                                value={riskData.beta.toFixed(2)}
                                                icon={BarChart3}
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* API Source Info */}
                    <motion.div variants={itemVariants}>
                        <div className="text-center text-[11px] text-[var(--color-text-secondary)] py-4">
                            <span>Veri kaynağı: </span>
                            <a
                                href="https://borsapy-api.onrender.com/docs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-400 hover:underline inline-flex items-center gap-1"
                            >
                                borsapy-api.onrender.com
                                <ExternalLink size={10} />
                            </a>
                        </div>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
});

AssetDetailPage.displayName = 'AssetDetailPage';

export default AssetDetailPage;

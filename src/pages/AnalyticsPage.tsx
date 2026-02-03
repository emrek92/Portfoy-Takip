import React, { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    TooltipProps
} from 'recharts';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import {
    TrendingUp,
    TrendingDown,
    PieChart as PieChartIcon,
    BarChart3,
    Target,
    Activity,
    Zap,
    Scale,
    Layers,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter
} from 'lucide-react';
import { cn, formatCurrency, formatPercentage } from '../lib/utils';
import type { PortfolioSummary, Holding } from '../store/useStore';

export interface AnalyticsPageProps {
    summary: PortfolioSummary | null;
    holdings: Holding[];
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#22c55e', '#ec4899', '#06b6d4', '#84cc16'];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: 'easeOut' as any },
    },
};

// --- Sub-components ---

const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-3 shadow-2xl backdrop-blur-md z-50">
                <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase mb-1.5">{label || payload[0].name}</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                            <span className="text-[11px] text-[var(--color-text-secondary)]">{entry.name}:</span>
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                {typeof entry.value === 'number'
                                    ? entry.name?.toLowerCase().includes('yüzde') || entry.name?.toLowerCase().includes('getiri')
                                        ? `%${entry.value.toFixed(2)}`
                                        : formatCurrency(entry.value)
                                    : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const AnalyticalCard = memo<{
    title: string;
    value: string;
    description?: string;
    icon: React.ElementType;
    trend?: { value: number; label: string };
    color: 'sky' | 'emerald' | 'rose' | 'amber' | 'violet';
}>(({ title, value, description, icon: Icon, trend, color }) => {
    const colorMap = {
        sky: 'from-sky-500/20 to-sky-500/5 text-sky-500 border-sky-500/20',
        emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-500 border-emerald-500/20',
        rose: 'from-rose-500/20 to-rose-500/5 text-rose-500 border-rose-500/20',
        amber: 'from-amber-500/20 to-amber-500/5 text-amber-500 border-amber-500/20',
        violet: 'from-violet-500/20 to-violet-500/5 text-violet-500 border-violet-500/20',
    };

    return (
        <Card variant="glass" className="overflow-hidden group h-full">
            <div className={cn("absolute top-0 right-0 w-20 h-20 bg-gradient-to-br -mr-8 -mt-8 rounded-full blur-2xl opacity-20", colorMap[color].split(' ')[0])} />
            <div className="relative flex items-center gap-3">
                <div className={cn('p-2.5 rounded-xl bg-gradient-to-br shadow-inner shrink-0', colorMap[color])}>
                    <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5 truncate">
                        {title}
                    </p>
                    <h4 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight truncate">
                        {value}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 h-4">
                        {trend ? (
                            <div className={cn(
                                "flex items-center gap-0.5 px-1 rounded-md text-[10px] font-bold",
                                trend.value >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            )}>
                                {trend.value >= 0 ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
                                {Math.abs(trend.value).toFixed(0)}%
                            </div>
                        ) : null}
                        {description && (
                            <span className="text-[10px] text-[var(--color-text-secondary)] font-medium truncate italic opacity-80">
                                {description}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
});

AnalyticalCard.displayName = 'AnalyticalCard';

// --- Main Page Component ---

const AnalyticsPage = memo<AnalyticsPageProps>(({ summary, holdings }) => {
    const [filterType, setFilterType] = useState<'all' | string>('all');

    // Get unique asset types for filtering
    const assetTypes = useMemo(() => {
        const types = new Set(holdings.map(h => h.asset_type));
        return ['all', ...Array.from(types)];
    }, [holdings]);

    // Filtered data for analysis
    const filteredHoldings = useMemo(() => {
        if (filterType === 'all') return holdings;
        return holdings.filter(h => h.asset_type === filterType);
    }, [holdings, filterType]);

    // Helper: Display name for mapping
    const getDisplayName = (h: Holding) =>
        h.asset_type === 'emtia' ? (h.name.length > 15 ? h.name.slice(0, 15) + '...' : h.name) : h.symbol;

    // --- Analytics Data Processing ---

    // 1. Asset Distribution (Pie)
    const assetDistributionData = useMemo(() => {
        const dist: Record<string, number> = {};
        filteredHoldings.forEach(h => {
            const label = h.asset_type.toUpperCase();
            dist[label] = (dist[label] || 0) + h.value;
        });
        const total = Object.values(dist).reduce((a, b) => a + b, 0);
        return Object.entries(dist).map(([name, value]) => ({
            name,
            value,
            percent: total > 0 ? (value / total) * 100 : 0
        })).sort((a, b) => b.value - a.value);
    }, [filteredHoldings]);

    // 2. Performance Ranking (Bar)
    const performanceData = useMemo(() => {
        return [...filteredHoldings]
            .sort((a, b) => b.pnl_pct - a.pnl_pct)
            .map(h => ({
                name: getDisplayName(h),
                Getiri: h.pnl_pct,
                Tutar: h.value,
                fill: h.pnl_pct >= 0 ? '#10b981' : '#ef4444'
            }));
    }, [filteredHoldings]);

    // 3. Concentration (Treemap-like top 10)
    const concentrationData = useMemo(() => {
        const sorted = [...filteredHoldings].sort((a, b) => b.value - a.value).slice(0, 10);
        const total = filteredHoldings.reduce((sum, h) => sum + h.value, 0);
        return sorted.map((h, i) => ({
            name: getDisplayName(h),
            Değer: h.value,
            Pay: total > 0 ? (h.value / total) * 100 : 0,
            fill: COLORS[i % COLORS.length]
        }));
    }, [filteredHoldings]);

    if (!summary || holdings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] text-[var(--color-text-secondary)]">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="font-bold italic">Analiz edilecek veri bulunamadı.</p>
                <p className="text-xs mt-2 uppercase tracking-widest text-sky-500/50">İşlem ekleyerek başlayın</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Filter Bar */}
            <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-tertiary)]/50 rounded-2xl border border-[var(--color-border)] shadow-sm">
                    <Filter size={14} className="text-sky-500" />
                    <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[500px]">
                        {assetTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={cn(
                                    "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                                    filterType === type
                                        ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)]"
                                )}
                            >
                                {type === 'all' ? 'TÜMÜ' : type}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-3 text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-tight">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                        <Activity size={12} />
                        {filteredHoldings.length} Aktif Varlık
                    </div>
                </div>
            </motion.div>

            {/* Top Analytics Dashboard - Main KPIs */}
            <motion.div variants={itemVariants}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AnalyticalCard
                        title="Toplam Değer"
                        value={formatCurrency(summary.total_value)}
                        description="Portföy büyüklüğü"
                        icon={Layers}
                        color="sky"
                    />
                    <AnalyticalCard
                        title="Net Kar / Zarar"
                        value={formatCurrency(summary.unrealized_pnl)}
                        trend={{ value: summary.roi_pct, label: 'ROI' }}
                        icon={summary.unrealized_pnl >= 0 ? TrendingUp : TrendingDown}
                        color={summary.unrealized_pnl >= 0 ? "emerald" : "rose"}
                    />
                    <AnalyticalCard
                        title="Günlük Değişim"
                        value={formatCurrency(summary.daily_change)}
                        trend={{ value: summary.daily_change_pct, label: 'Daily' }}
                        icon={Activity}
                        color={summary.daily_change >= 0 ? "emerald" : "rose"}
                    />
                    <AnalyticalCard
                        title="Varlık Sayısı"
                        value={summary.holdings_count.toString()}
                        description={`${holdings.filter(h => h.pnl_pct > 0).length} kârlı pozisyon`}
                        icon={Zap}
                        color="violet"
                    />
                </div>
            </motion.div>

            {/* Secondary KPIs */}
            <motion.div variants={itemVariants}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-card flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-1">En İyi Performans</p>
                            <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{summary.top_performer || 'N/A'}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                            <ArrowUpRight size={18} />
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-card flex items-center justify-between group hover:border-rose-500/30 transition-colors">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-1">En Düşük Performans</p>
                            <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{summary.worst_performer || 'N/A'}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
                            <ArrowDownRight size={18} />
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-card flex items-center justify-between group hover:border-sky-500/30 transition-colors">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-1">Haftalık Değişim</p>
                            <p className={cn("text-sm font-bold font-mono", summary.weekly_change >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                {formatCurrency(summary.weekly_change)}
                            </p>
                        </div>
                        <div className={cn("p-2 rounded-xl bg-sky-500/10 text-sky-500 group-hover:scale-110 transition-transform", summary.weekly_change >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                            <Activity size={18} />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Asset Type Distribution */}
                <motion.div variants={itemVariants} className="lg:col-span-1">
                    <Card variant="glass" className="h-full shadow-card">
                        <CardHeader
                            title="Varlık Dağılımı"
                            subtitle="Portföyün türlere göre ağırlığı"
                        />
                        <CardContent className="h-[300px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={assetDistributionData}
                                        cx="50%"
                                        cy="55%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} %${(percent ?? 0).toFixed(0)}`}
                                        labelLine={false}
                                        stroke="transparent"
                                    >
                                        {assetDistributionData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 2. Top Concentration Bar Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card variant="glass" className="h-full shadow-card">
                        <CardHeader
                            title="Yoğunlaşma Analizi"
                            subtitle="En yüksek değere sahip ilk 10 pozisyon (TL)"
                        />
                        <CardContent className="h-[300px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={concentrationData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 10, fontWeight: 700 }}
                                        width={90}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="Değer" radius={[0, 4, 4, 0]} barSize={24}>
                                        {concentrationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 3. Performance Ranking Histogram */}
                <motion.div variants={itemVariants} className="lg:col-span-3">
                    <Card variant="glass" className="shadow-card">
                        <CardHeader
                            title="Performans İzleme"
                            subtitle="Tüm varlıkların kârlılık sıralaması (%)"
                        />
                        <CardContent className="h-[280px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData} margin={{ bottom: 40, top: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.2} />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 10, fontWeight: 600 }}
                                        height={70}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={(v) => `%${v}`}
                                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 10, fontStyle: 'italic' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="Getiri" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {performanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.Getiri >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

            </div>

            {/* Quick Insights Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-card relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Target size={100} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <TrendingUp size={20} />
                        </div>
                        <h5 className="font-bold text-[var(--color-text-primary)] uppercase tracking-tight">Akıllı İçgörü</h5>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed relative z-10">
                        Portföyünüzde <span className="text-emerald-500 font-bold">%{((holdings.filter(h => h.pnl_pct > 0).length / holdings.length) * 100).toFixed(0)}</span> başarı oranı bulunuyor.
                        En yüksek getiriyi <span className="text-[var(--color-text-primary)] font-bold">{summary?.top_performer || 'N/A'}</span> sağladı.
                        Yatırımlarınızın <span className="text-sky-500 font-bold">%{((concentrationData[0]?.Değer / summary.total_value) * 100).toFixed(0)}</span>'i en büyük pozisyonunuzda yoğunlaşmış durumda.
                    </p>
                </div>

                <div className="p-6 rounded-3xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-card relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <PieChartIcon size={100} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                            <BarChart3 size={20} />
                        </div>
                        <h5 className="font-bold text-[var(--color-text-primary)] uppercase tracking-tight">Varlık Kompozisyonu</h5>
                    </div>
                    <div className="space-y-3 relative z-10">
                        {assetDistributionData.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-[var(--color-text-secondary)] font-medium">{item.name}</span>
                                    <span className="text-[var(--color-text-primary)] font-bold">%{item.percent.toFixed(1)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-sky-500 rounded-full"
                                        style={{ width: `${item.percent}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
});

AnalyticsPage.displayName = 'AnalyticsPage';

export default AnalyticsPage;

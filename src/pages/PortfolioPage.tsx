import React, { memo, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ArrowUpDown,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    X,
    Calendar,
    DollarSign,
    Package,
    Wallet,
    Sparkles,
    Zap,
    Activity,
    History,
    Award,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Layers,
    ChevronDown,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { cn, formatCurrency, formatPercentage, formatDate } from '../lib/utils';
import type { Holding, Transaction, PortfolioSummary, LastUpdates } from '../store/useStore';

export interface PortfolioPageProps {
    holdings: Holding[];
    summary: PortfolioSummary | null;
    lastUpdates?: LastUpdates;
    transactions?: Transaction[];
    onViewHistory?: (symbol: string) => void;
    onAddTransaction?: (symbol: string, type: 'buy' | 'sell') => void;
    onViewDetail?: (holding: Holding) => void;
    isLoading?: boolean;
}

type SortField = 'symbol' | 'value' | 'pnl_pct' | 'quantity';
type SortDirection = 'asc' | 'desc';
type PnlRange = 'all' | 'weekly' | 'monthly' | 'yearly' | 'custom';

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

// --- Helper Functions ---

const formatLastDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '-';
    }
};

// --- Sub-components ---

interface DashboardStatProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    variant: 'emerald' | 'rose' | 'sky' | 'amber' | 'violet';
    loading?: boolean;
}

const DashboardStat = memo<DashboardStatProps>(({ title, value, subtitle, icon: Icon, variant, loading }) => {
    const variants = {
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        sky: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    };

    if (loading) {
        return (
            <Card variant="glass" padding="sm" className="overflow-hidden h-full shadow-sm border-[var(--color-border)]/50">
                <div className="flex items-center gap-2.5">
                    <Skeleton variant="circle" className="w-8 h-8 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-2 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card variant="glass" padding="sm" className="overflow-hidden group h-full transition-all hover:bg-white/5 shadow-sm border-[var(--color-border)]/50">
            <div className="relative flex items-center gap-2.5">
                <div className={cn('p-2 rounded-lg shrink-0 border', variants[variant])}>
                    <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em] mb-1 truncate opacity-70">
                        {title}
                    </p>
                    <h4 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-tight truncate font-mono">
                        {subtitle || value}
                    </h4>
                    {subtitle && (
                        <p className={cn(
                            "text-[11px] font-medium truncate font-mono leading-none mt-1",
                            variant === 'emerald' ? 'text-emerald-500' :
                                variant === 'rose' ? 'text-rose-500' : 'text-[var(--color-text-secondary)]'
                        )}>
                            {value}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
});

DashboardStat.displayName = 'DashboardStat';

// Transaction Detail Modal
const TransactionModal = memo<{
    holding: Holding | null;
    transactions: Transaction[];
    onClose: () => void;
    onViewHistory?: (symbol: string) => void;
    onAddTransaction?: (symbol: string, type: 'buy' | 'sell') => void;
    onViewDetail?: (holding: Holding) => void;
}>(({ holding, transactions, onClose, onViewHistory, onAddTransaction, onViewDetail }) => {
    if (!holding) return null;

    const holdingTransactions = transactions.filter(t => t.symbol === holding.symbol);
    const displayTransactions = holdingTransactions.slice(0, 3);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl shadow-float max-w-2xl w-full max-h-[85vh] overflow-hidden backdrop-blur-md"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[var(--color-border)]/30 bg-gradient-to-br from-[var(--color-bg-tertiary)]/80 to-[var(--color-bg-secondary)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    'p-3 rounded-2xl shadow-inner',
                                    holding.pnl_pct >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                )}>
                                    {holding.pnl_pct >= 0
                                        ? <TrendingUp size={22} />
                                        : <TrendingDown size={22} />
                                    }
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                        {holding.symbol}
                                    </h2>
                                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider opacity-60">
                                        {holding.name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {onViewDetail && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            onViewDetail(holding);
                                            onClose();
                                        }}
                                        className="bg-sky-500 text-white hover:bg-sky-600 border-0 h-8 px-3 rounded-lg mr-2"
                                        leftIcon={<ChevronRight size={14} />}
                                    >
                                        Detay Sayfası
                                    </Button>
                                )}
                                {onAddTransaction && (
                                    <div className="flex p-1 bg-[var(--color-bg-primary)]/50 rounded-xl border border-[var(--color-border)]/50 mr-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                onAddTransaction(holding.symbol, 'buy');
                                                onClose();
                                            }}
                                            className="text-emerald-500 hover:bg-emerald-500/10 h-8 px-3 rounded-lg"
                                            leftIcon={<TrendingUp size={14} />}
                                        >
                                            Al
                                        </Button>
                                        <div className="w-px h-4 bg-[var(--color-border)] my-auto mx-1" />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                onAddTransaction(holding.symbol, 'sell');
                                                onClose();
                                            }}
                                            className="text-rose-500 hover:bg-rose-500/10 h-8 px-3 rounded-lg"
                                            leftIcon={<TrendingDown size={14} />}
                                        >
                                            Sat
                                        </Button>
                                    </div>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2.5 rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats Grid */}
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 bg-[var(--color-bg-primary)]/20">
                        <div>
                            <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-1">
                                Toplam Adet
                            </p>
                            <p className="text-base font-bold text-[var(--color-text-primary)] font-mono">
                                {holding.quantity.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-1">
                                Ort. Maliyet
                            </p>
                            <p className="text-base font-bold text-[var(--color-text-primary)] font-mono">
                                {formatCurrency(holding.avg_cost)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-1">
                                Cari Fiyat
                            </p>
                            <p className="text-base font-bold text-sky-400 font-mono">
                                {formatCurrency(holding.current_price)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-1">
                                Portföy K/Z
                            </p>
                            <div className="flex flex-col">
                                <span className={cn('text-base font-bold font-mono', holding.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                                    {formatCurrency(holding.pnl)}
                                </span>
                                <span className={cn('text-[11px] font-bold font-mono opacity-80', holding.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                                    {formatPercentage(holding.pnl_pct)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Holding Duration */}
                    {holdingTransactions.length > 0 && (() => {
                        const buyTransactions = holdingTransactions.filter(t => t.type === 'buy' && t.date);
                        if (buyTransactions.length === 0) return null;

                        const now = new Date();
                        let totalWeightedDays = 0;
                        let totalQuantity = 0;

                        buyTransactions.forEach(tx => {
                            const txDate = new Date(tx.date);
                            if (isNaN(txDate.getTime())) return;

                            const daysDiff = Math.max(0, Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)));
                            totalWeightedDays += daysDiff * tx.quantity;
                            totalQuantity += tx.quantity;
                        });

                        const avgDays = totalQuantity > 0 ? Math.round(totalWeightedDays / totalQuantity) : 0;
                        const months = Math.floor(avgDays / 30);
                        const years = Math.floor(avgDays / 365);

                        let durationText = `${avgDays} gün`;
                        if (years > 0) {
                            durationText = `${years} yıl ${Math.floor((avgDays % 365) / 30)} ay`;
                        } else if (months > 0) {
                            durationText = `${months} ay ${avgDays % 30} gün`;
                        }

                        return (
                            <div className="px-6 py-4 border-y border-[var(--color-border)]/30 bg-amber-500/5 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-sm">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">
                                                Ortalama Tutma Süresi
                                            </p>
                                            <p className="text-lg font-bold text-amber-500 tracking-tight">
                                                {durationText}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest opacity-60">
                                            İlk Pozisyon
                                        </p>
                                        <p className="text-xs font-semibold text-[var(--color-text-primary)] font-mono">
                                            {formatDate(holdingTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Transactions List */}
                    <div className="p-6 overflow-y-auto max-h-[45vh] no-scrollbar space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">
                                İŞLEM GEÇMİŞİ ({holdingTransactions.length})
                            </h3>
                        </div>

                        {holdingTransactions.length > 0 ? (
                            <div className="space-y-2.5">
                                {displayTransactions.map((tx, index) => (
                                    <motion.div
                                        key={tx.id || index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                            'p-4 rounded-2xl border transition-all hover:border-[var(--color-border)] group shadow-card',
                                            tx.type === 'buy'
                                                ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                                                : 'bg-rose-500/[0.04] border-rose-500/20'
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                <div className={cn(
                                                    'p-2 rounded-xl shadow-sm border',
                                                    tx.type === 'buy'
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                                )}>
                                                    {tx.type === 'buy' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={cn(
                                                        'text-[11px] font-bold tracking-widest uppercase mb-0.5',
                                                        tx.type === 'buy' ? 'text-emerald-500' : 'text-rose-500'
                                                    )}>
                                                        {tx.type === 'buy' ? 'ALIŞ' : 'SATIŞ'}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-secondary)] font-semibold font-mono opacity-80">
                                                        <Calendar size={10} />
                                                        {tx.date}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8 text-right shrink-0">
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-bold text-[var(--color-text-primary)] font-mono">
                                                        {tx.quantity.toLocaleString('tr-TR')}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--color-text-secondary)] font-semibold font-mono opacity-60">
                                                        @ {formatCurrency(tx.price)}
                                                    </p>
                                                </div>
                                                <div className="min-w-[80px]">
                                                    <p className={cn(
                                                        'text-sm font-bold font-mono tracking-tight',
                                                        tx.type === 'buy' ? 'text-emerald-500' : 'text-rose-500'
                                                    )}>
                                                        {tx.type === 'buy' ? '+' : '-'}{formatCurrency(tx.total)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {tx.notes && (
                                            <div className="mt-2.5 pt-2.5 border-t border-[var(--color-border)]/20">
                                                <p className="text-[10px] text-[var(--color-text-secondary)] italic leading-relaxed opacity-80">
                                                    {tx.notes}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                {onViewHistory && (
                                    <div className="mt-4 pt-2 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                            onClick={() => onViewHistory(holding.symbol)}
                                            rightIcon={<ChevronRight size={16} />}
                                        >
                                            Tüm Geçmişi Gör
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Package size={32} className="mx-auto text-[var(--color-text-secondary)] mb-2" />
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    Bu varlık için işlem geçmişi bulunamadı
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
});

TransactionModal.displayName = 'TransactionModal';

const PortfolioPage = memo<PortfolioPageProps>(({ holdings, summary, lastUpdates, transactions = [], onViewHistory, onAddTransaction, onViewDetail, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const [sortField, setSortField] = useState<SortField>('value');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

    const assetTypes = useMemo(() => {
        const types = new Set(holdings.map((h) => h.asset_type));
        return ['all', ...Array.from(types)];
    }, [holdings]);

    const distributionData = useMemo(() => {
        const dist: Record<string, number> = {};
        holdings.forEach(h => {
            const label = h.asset_type.toUpperCase();
            dist[label] = (dist[label] || 0) + h.value;
        });
        return Object.entries(dist).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value);
    }, [holdings]);

    const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];

    const filteredAndSortedHoldings = useMemo(() => {
        let result = [...holdings];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (h) =>
                    h.symbol.toLowerCase().includes(term) ||
                    h.name.toLowerCase().includes(term)
            );
        }

        if (filterType !== 'all') {
            result = result.filter((h) => h.asset_type === filterType);
        }

        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'symbol':
                    comparison = a.symbol.localeCompare(b.symbol);
                    break;
                case 'value':
                    comparison = a.value - b.value;
                    break;
                case 'pnl_pct':
                    comparison = a.pnl_pct - b.pnl_pct;
                    break;
                case 'quantity':
                    comparison = a.quantity - b.quantity;
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [holdings, searchTerm, filterType, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const assetTypeLabels: Record<string, string> = {
        'all': 'Tümü',
        'hisse': 'Hisse',
        'fon': 'Fon',
        'kripto': 'Kripto',
        'doviz': 'Döviz',
        'emtia': 'Emtia',
    };

    const assetTypeColors: Record<string, { bg: string; text: string }> = {
        'hisse': { bg: 'bg-sky-500/10', text: 'text-sky-400' },
        'fon': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
        'kripto': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
        'doviz': { bg: 'bg-violet-500/10', text: 'text-violet-400' },
        'emtia': { bg: 'bg-rose-500/10', text: 'text-rose-400' },
    };

    const isPnLPositive = (summary?.unrealized_pnl || 0) >= 0;

    return (
        <>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4 max-w-[1600px] mx-auto"
            >
                {/* 1. Ultra Compact Hero Header */}
                {summary && (
                    <motion.div variants={itemVariants}>
                        <Card variant="glass" className="relative p-3 md:px-5 md:py-4 bg-gradient-to-br from-sky-500/10 via-transparent to-emerald-500/10 border-0 shadow-md">
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="space-y-0 text-left">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Sparkles size={11} className="text-amber-500 group-hover:animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-80">PORTFÖY ÖZETİ</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)] tracking-tight font-mono">
                                            {formatCurrency(summary.total_value)}
                                        </h1>
                                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)]/30 text-[13px] font-medium text-[var(--color-text-secondary)] font-mono shadow-inner">
                                            <DollarSign size={10} className="text-emerald-500" />
                                            <span>${(summary.total_value_usd || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                            <Activity size={9} className="text-sky-500" />
                                            <span className="font-mono opacity-80">Piyasa: {formatLastDate(lastUpdates?.market || null)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                            <Zap size={9} className="text-emerald-500" />
                                            <span className="font-mono opacity-80">Tefas: {formatLastDate(lastUpdates?.tefas || null)}</span>
                                        </div>
                                    </div>
                                </div>


                                <div className={cn(
                                    "flex items-center gap-4 px-4 py-2 rounded-xl transition-all",
                                    isPnLPositive ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    <div className="flex flex-col leading-tight text-right">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-0.5 opacity-60">BEKLEYEN KAR/ZARAR</span>
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xl font-bold tracking-tight font-mono">
                                                {isPnLPositive ? '+' : ''}{formatCurrency(summary.unrealized_pnl)}
                                            </span>
                                            <span className={cn(
                                                "text-xs font-bold font-mono px-1.5 py-0.5 rounded-md",
                                                isPnLPositive ? "bg-emerald-500/10" : "bg-rose-500/10"
                                            )}>
                                                ({formatPercentage(summary.roi_pct)})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Distribution Chart */}
                                <div className="hidden lg:block w-48 h-20 border-l border-[var(--color-border)]/30 pl-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={distributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={25}
                                                outerRadius={38}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="transparent"
                                            >
                                                {distributionData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-2 shadow-xl backdrop-blur-md">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-primary)]">{data.name}</p>
                                                                <p className="text-[10px] font-mono text-sky-400">{formatCurrency(data.value)}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* 2. Key Stats Grid (Merged Dashboard Stats) */}
                {(summary || isLoading) && (
                    <motion.div variants={itemVariants}>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <DashboardStat
                                title="Günlük Değişim"
                                value={formatPercentage(summary?.daily_change_pct || 0)}
                                subtitle={formatCurrency(summary?.daily_change || 0)}
                                icon={TrendingUp}
                                variant={(summary?.daily_change || 0) >= 0 ? "emerald" : "rose"}
                                loading={isLoading && !summary}
                            />
                            <DashboardStat
                                title="Haftalık Değişim"
                                value={formatPercentage(summary?.weekly_change_pct || 0)}
                                subtitle={formatCurrency(summary?.weekly_change || 0)}
                                icon={Calendar}
                                variant={(summary?.weekly_change || 0) >= 0 ? "emerald" : "rose"}
                                loading={isLoading && !summary}
                            />
                            <DashboardStat
                                title="Aylık Değişim"
                                value={formatPercentage(summary?.monthly_change_pct || 0)}
                                subtitle={formatCurrency(summary?.monthly_change || 0)}
                                icon={Calendar}
                                variant={(summary?.monthly_change || 0) >= 0 ? "emerald" : "rose"}
                                loading={isLoading && !summary}
                            />
                            <DashboardStat
                                title="Gerçekleşen Kar"
                                value={formatCurrency(summary?.realized_pnl || 0)}
                                subtitle="Tüm zamanlar"
                                icon={History}
                                variant={(summary?.realized_pnl || 0) >= 0 ? "emerald" : "rose"}
                                loading={isLoading && !summary}
                            />
                            <DashboardStat
                                title="En İyi Varlık"
                                value={summary?.top_performer || '-'}
                                subtitle="Getiri lideri"
                                icon={Award}
                                variant="emerald"
                                loading={isLoading && !summary}
                            />
                            <DashboardStat
                                title="En Kötü Varlık"
                                value={summary?.worst_performer || '-'}
                                subtitle="Getiri sonuncusu"
                                icon={AlertTriangle}
                                variant="rose"
                                loading={isLoading && !summary}
                            />
                        </div>
                    </motion.div>
                )}

                {/* 3. Portfolio Management Tools (Compact Filter Row) */}
                <motion.div variants={itemVariants}>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="w-full sm:w-64">
                            <Input
                                placeholder="Varlık ara..."
                                value={searchTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                leftIcon={<Search size={14} />}
                                className="bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border)] focus:border-sky-500/30 text-xs !py-2"
                            />
                        </div>
                        <div className="flex-1 w-full overflow-hidden">
                            <div className="flex gap-1.5 p-1 bg-[var(--color-bg-secondary)]/30 rounded-xl border border-[var(--color-border)] overflow-x-auto no-scrollbar shadow-inner">
                                {assetTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={cn(
                                            "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                            filterType === type
                                                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                                                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)]"
                                        )}
                                    >
                                        {assetTypeLabels[type] || type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-text-secondary)] uppercase bg-[var(--color-bg-tertiary)]/30 px-3 py-2 rounded-xl border border-[var(--color-border)]">
                            <Package size={12} className="text-sky-400" />
                            <span className="font-mono">{filteredAndSortedHoldings.length} Varlık</span>
                        </div>
                    </div>
                </motion.div>

                {/* 4. Holdings Grid */}
                <motion.div variants={itemVariants}>
                    <Card variant="glass" padding="none" className="overflow-hidden border-0 shadow-lg">
                        {/* Table Header - Compact */}
                        <div className="hidden md:grid grid-cols-7 gap-3 px-6 py-3 bg-[var(--color-bg-tertiary)]/30 border-b border-[var(--color-border)]/50 text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em] opacity-80">
                            <button onClick={() => handleSort('symbol')} className="flex items-center gap-1 hover:text-sky-400 transition-colors text-left uppercase">
                                VARLIK {sortField === 'symbol' && <ChevronDown size={12} className={sortDirection === 'asc' ? 'rotate-180' : ''} />}
                            </button>
                            <button onClick={() => handleSort('quantity')} className="flex items-center gap-1 hover:text-sky-400 transition-colors uppercase">
                                ADET {sortField === 'quantity' && <ChevronDown size={12} className={sortDirection === 'asc' ? 'rotate-180' : ''} />}
                            </button>
                            <div className="uppercase flex items-center">MALİYET</div>
                            <div className="uppercase flex items-center">CARI FIYAT</div>
                            <button onClick={() => handleSort('pnl_pct')} className="flex items-center gap-1 justify-center hover:text-sky-400 transition-colors text-center uppercase">
                                K/Z % {sortField === 'pnl_pct' && <ChevronDown size={12} className={sortDirection === 'asc' ? 'rotate-180' : ''} />}
                            </button>
                            <button onClick={() => handleSort('value')} className="flex items-center gap-1 justify-end hover:text-sky-400 transition-colors text-right uppercase">
                                DEĞER {sortField === 'value' && <ChevronDown size={12} className={sortDirection === 'asc' ? 'rotate-180' : ''} />}
                            </button>
                            <div className="text-right uppercase flex items-center justify-end">AKSİYON</div>
                        </div>

                        {/* Holdings List */}
                        <div className="divide-y divide-[var(--color-border)]/30 min-h-[400px]">
                            {isLoading && holdings.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="px-6 py-5">
                                        <Skeleton variant="row" className="h-10" />
                                    </div>
                                ))
                            ) : filteredAndSortedHoldings.length > 0 ? (
                                filteredAndSortedHoldings.map((holding, index) => {
                                    const colors = assetTypeColors[holding.asset_type] || assetTypeColors['hisse'];
                                    const isPos = holding.pnl_pct >= 0;

                                    return (
                                        <motion.div
                                            key={holding.symbol}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileHover={{ y: -2, scale: 1.002, backgroundColor: 'rgba(14, 165, 233, 0.04)' }}
                                            whileTap={{ scale: 0.998 }}
                                            transition={{
                                                opacity: { duration: 0.2, delay: index * 0.02 },
                                                y: { type: 'spring', stiffness: 300, damping: 20 }
                                            }}
                                            onClick={() => setSelectedHolding(holding)}
                                            className="grid grid-cols-2 md:grid-cols-7 gap-3 px-6 py-3.5 border-b border-[var(--color-border)]/20 last:border-0 transition-shadow hover:shadow-lg hover:shadow-sky-500/5 cursor-pointer group relative overflow-hidden"
                                        >
                                            {/* Symbol */}
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold border transition-transform group-hover:scale-110 shrink-0 font-mono',
                                                    colors.bg, colors.text, 'border-current/20'
                                                )}>
                                                    {holding.symbol.slice(0, 2)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[13px] font-semibold text-[var(--color-text-primary)] group-hover:text-sky-400 transition-colors uppercase">
                                                            {holding.symbol}
                                                        </span>
                                                        <ChevronRight size={10} className="text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                                                    </div>
                                                    <p className="text-[10px] text-[var(--color-text-secondary)] font-medium uppercase opacity-50 leading-tight">
                                                        {holding.name}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Quantity */}
                                            <div className="hidden md:flex items-center">
                                                <span className="text-[13px] font-semibold text-[var(--color-text-primary)] font-mono">
                                                    {holding.quantity.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {/* Cost */}
                                            <div className="hidden md:flex items-center">
                                                <span className="text-[13px] font-medium text-[var(--color-text-secondary)] font-mono">
                                                    {formatCurrency(holding.avg_cost)}
                                                </span>
                                            </div>

                                            {/* Price */}
                                            <div className="hidden md:flex items-center">
                                                <span className="text-[13px] font-semibold text-[var(--color-text-primary)] font-mono">
                                                    {formatCurrency(holding.current_price)}
                                                </span>
                                            </div>

                                            {/* PnL */}
                                            <div className="flex items-center justify-end md:justify-center">
                                                <div className={cn(
                                                    'flex items-center gap-0.5 text-[13px] font-semibold font-mono',
                                                    isPos ? 'text-emerald-500' : 'text-rose-500'
                                                )}>
                                                    {isPos ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                                    {formatPercentage(holding.pnl_pct)}
                                                </div>
                                            </div>

                                            {/* Value */}
                                            <div className="flex items-center justify-end">
                                                <span className="text-[13px] font-semibold text-sky-400 tracking-tight font-mono">
                                                    {formatCurrency(holding.value)}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="hidden md:flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddTransaction?.(holding.symbol, 'buy');
                                                    }}
                                                    className="w-10 h-8 p-0 text-emerald-500 hover:bg-emerald-500/10 rounded-lg group/btn"
                                                >
                                                    <TrendingUp size={16} className="group-hover/btn:scale-110 transition-transform" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddTransaction?.(holding.symbol, 'sell');
                                                    }}
                                                    className="w-10 h-8 p-0 text-rose-500 hover:bg-rose-500/10 rounded-lg group/btn"
                                                >
                                                    <TrendingDown size={16} className="group-hover/btn:scale-110 transition-transform" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : null}

                            {filteredAndSortedHoldings.length === 0 && (
                                <div className="px-6 py-20 text-center">
                                    <Package size={48} className="mx-auto text-[var(--color-text-secondary)] mb-4 opacity-10" />
                                    <p className="text-[var(--color-text-secondary)] font-bold uppercase tracking-widest italic text-sm">
                                        {searchTerm
                                            ? 'Arama kriterlerine uygun varlık bulunamadı'
                                            : 'Portföyünüzde henüz varlık bulunmuyor'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Transaction Modal */}
            {
                selectedHolding && (
                    <TransactionModal
                        holding={selectedHolding}
                        transactions={transactions}
                        onClose={() => setSelectedHolding(null)}
                        onViewHistory={onViewHistory}
                        onAddTransaction={onAddTransaction}
                        onViewDetail={onViewDetail}
                    />
                )
            }
        </>
    );
});

PortfolioPage.displayName = 'PortfolioPage';

export default PortfolioPage;

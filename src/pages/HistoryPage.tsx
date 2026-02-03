import React, { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import {
    Search, TrendingUp, TrendingDown, Edit3, Trash2, X,
    Calendar, DollarSign, Package, Save, AlertTriangle, History,
    Plus, AlertCircle, Calculator
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { cn, formatCurrency, formatDate, formatDateForInput } from '../lib/utils';
import { useStore } from '../store/useStore';
import type { Transaction, Holding } from '../store/useStore';

export interface HistoryPageProps {
    transactions?: Transaction[];
    holdings?: Holding[];
    onRefresh?: () => void;
    initialSearchTerm?: string;
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

// AddTransactionModal removed as it is now global


// Edit Transaction Modal
const EditTransactionModal = memo<{
    transaction: Transaction | null;
    onClose: () => void;
    onSave: (tx: Transaction) => void;
}>(({ transaction, onClose, onSave }) => {
    const [formData, setFormData] = useState<Transaction | null>(transaction);

    if (!transaction || !formData) return null;

    const handleSave = () => {
        if (formData) {
            onSave({
                ...formData,
                total: formData.quantity * formData.price,
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-md w-full"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-sky-500/10">
                            <Edit3 size={20} className="text-sky-500" />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                            İşlemi Düzenle
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]">
                        <X size={20} className="text-[var(--color-text-secondary)]" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Tarih
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="w-full mt-2 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                Adet
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                                className="w-full mt-2 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                Fiyat
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                className="w-full mt-2 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                            İşlem Tipi
                        </label>
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={() => setFormData({ ...formData, type: 'buy' })}
                                className={cn(
                                    'flex-1 p-3 rounded-xl border transition-all font-medium',
                                    formData.type === 'buy'
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-emerald-500/50'
                                )}
                            >
                                <TrendingUp size={16} className="inline mr-2" />
                                Alış
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'sell' })}
                                className={cn(
                                    'flex-1 p-3 rounded-xl border transition-all font-medium',
                                    formData.type === 'sell'
                                        ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-rose-500/50'
                                )}
                            >
                                <TrendingDown size={16} className="inline mr-2" />
                                Satış
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Not
                        </label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            className="w-full mt-2 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                            placeholder="İşlem notu (opsiyonel)"
                        />
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--color-bg-tertiary)]">
                        <p className="text-xs text-[var(--color-text-secondary)]">Toplam Tutar</p>
                        <p className="text-xl font-bold text-sky-500">
                            {formatCurrency(formData.quantity * formData.price)}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-5 border-t border-[var(--color-border)]">
                    <Button variant="ghost" onClick={onClose} className="flex-1">
                        İptal
                    </Button>
                    <Button variant="primary" onClick={handleSave} leftIcon={<Save size={16} />} className="flex-1">
                        Kaydet
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
});

EditTransactionModal.displayName = 'EditTransactionModal';

// Delete Confirmation Modal
const DeleteConfirmModal = memo<{
    transaction: Transaction | null;
    onClose: () => void;
    onConfirm: () => void;
}>(({ transaction, onClose, onConfirm }) => {
    if (!transaction) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-sm w-full p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center">
                    <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 mb-4">
                        <AlertTriangle size={32} className="text-rose-500" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                        İşlemi Sil
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                        <strong>{transaction.symbol}</strong> için {formatDate(transaction.date)} tarihli işlem silinecek. Bu işlem geri alınamaz.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} className="flex-1">
                            İptal
                        </Button>
                        <Button variant="danger" onClick={onConfirm} leftIcon={<Trash2 size={16} />} className="flex-1">
                            Sil
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
});

DeleteConfirmModal.displayName = 'DeleteConfirmModal';

const HistoryPage = memo<HistoryPageProps>(({ transactions = [], holdings = [], onRefresh, initialSearchTerm }) => {
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
    const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    // Removed showAddModal and existingSymbols

    // Use a ref to track if we've already initialized once
    const initialized = React.useRef(false);

    React.useEffect(() => {
        if (initialSearchTerm && !initialized.current) {
            setSearchTerm(initialSearchTerm);
            initialized.current = true;
        }
    }, [initialSearchTerm]);

    const filteredTransactions = useMemo(() => {
        let result = [...transactions];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (t) =>
                    t.symbol.toLowerCase().includes(term) ||
                    t.name.toLowerCase().includes(term)
            );
        }

        if (filterType !== 'all') {
            result = result.filter((t) => t.type === filterType);
        }

        if (startDate) {
            result = result.filter((t) => t.date >= startDate);
        }

        if (endDate) {
            result = result.filter((t) => t.date <= endDate);
        }

        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return result;
    }, [transactions, searchTerm, filterType, startDate, endDate]);

    // Calculate realized profit and duration contribution for each transaction (FIFO method)
    const { profits, txDurations } = useMemo(() => {
        const txProfits: Record<string, number> = {};
        const txDurationsMap: Record<string, number> = {};
        const openLots: Record<string, { txId: string; date: Date; qty: number; price: number }[]> = {};

        const now = new Date();

        // Sort ALL transactions by date for correct FIFO flow
        const sortedAll = [...transactions].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (isNaN(dateA.getTime())) return 1; // Invalid dates go to the end
            if (isNaN(dateB.getTime())) return -1; // Invalid dates go to the end
            return dateA.getTime() - dateB.getTime();
        });

        for (const tx of sortedAll) {
            const txDate = new Date(tx.date);
            if (isNaN(txDate.getTime())) {
                txProfits[tx.id.toString()] = 0;
                txDurationsMap[tx.id.toString()] = 0;
                continue; // Skip invalid dates
            }

            const sym = tx.symbol;
            if (!openLots[sym]) openLots[sym] = [];

            if (tx.type === 'buy') {
                openLots[sym].push({ txId: tx.id, date: txDate, qty: tx.quantity, price: tx.price });
                txProfits[tx.id.toString()] = 0;
                // For a 'buy' transaction, its "duration" is how long it's been held so far
                txDurationsMap[tx.id.toString()] = Math.max(0, (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
            } else {
                let remainingToSell = tx.quantity;
                let profit = 0;
                let totalDaysWeighted = 0;
                let soldQtyResult = 0;
                const sellDate = txDate;

                while (remainingToSell > 0 && openLots[sym].length > 0) {
                    const lot = openLots[sym][0];
                    const qtyFromLot = Math.min(remainingToSell, lot.qty);

                    // Duration from Buy to Sell
                    const days = Math.max(0, (sellDate.getTime() - lot.date.getTime()) / (1000 * 60 * 60 * 24));
                    totalDaysWeighted += days * qtyFromLot;
                    soldQtyResult += qtyFromLot;

                    profit += qtyFromLot * (tx.price - lot.price);

                    remainingToSell -= qtyFromLot;
                    lot.qty -= qtyFromLot;

                    if (lot.qty <= 0) openLots[sym].shift();
                }
                txProfits[tx.id.toString()] = profit;
                // Duration for the 'sell' transaction is the average age of the lots it closed
                txDurationsMap[tx.id.toString()] = soldQtyResult > 0 ? (totalDaysWeighted / soldQtyResult) : 0;
            }
        }

        return { profits: txProfits, txDurations: txDurationsMap };
    }, [transactions]);

    const stats = useMemo(() => {
        const buys = filteredTransactions.filter((t) => t.type === 'buy');
        const sells = filteredTransactions.filter((t) => t.type === 'sell');

        const totalProfit = filteredTransactions.reduce((sum, t) => sum + (profits[t.id.toString()] || 0), 0);

        // Weighted average duration of the FILTERED set
        // (Sum of Duration * Quantity) / Total Quantity
        let totalWeightedDuration = 0;
        let totalQuantity = 0;

        filteredTransactions.forEach(t => {
            const dur = txDurations[t.id.toString()] || 0;
            totalWeightedDuration += dur * t.quantity;
            totalQuantity += t.quantity;
        });

        return {
            totalBuy: buys.reduce((sum, t) => sum + t.total, 0),
            totalProfit,
            buyCount: buys.length,
            sellCount: sells.length,
            avgHoldDays: totalQuantity > 0 ? Math.round(totalWeightedDuration / totalQuantity) : 0
        };
    }, [filteredTransactions, profits, txDurations]);

    const handleEditSave = async (tx: Transaction) => {
        try {
            await invoke('update_transaction', { transaction: tx });
            await useStore.getState().triggerAutoBackup();
            setEditingTx(null);
            onRefresh?.();
        } catch (error) {
            console.error('Update failed:', error);
            alert('Güncelleme hatası: ' + error);
        }
    };

    const handleDelete = async () => {
        if (!deletingTx) return;
        try {
            await invoke('delete_transaction', { transactionId: deletingTx.id });
            await useStore.getState().triggerAutoBackup();
            setDeletingTx(null);
            onRefresh?.();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Silme hatası: ' + error);
        }
    };

    const handleAddSave = () => {
        onRefresh?.();
    };

    return (
        <>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
            >
                {/* Filters */}
                <motion.div variants={itemVariants}>
                    <Card variant="glass" className="border-0 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="İşlem ara..."
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    leftIcon={<Search size={18} />}
                                    rightIcon={searchTerm ? (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    ) : null}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={filterType === 'all' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilterType('all')}
                                >
                                    Tümü
                                </Button>
                                <Button
                                    variant={filterType === 'buy' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilterType('buy')}
                                    leftIcon={<TrendingUp size={16} className="text-emerald-500" />}
                                >
                                    Alım
                                </Button>
                                <Button
                                    variant={filterType === 'sell' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilterType('sell')}
                                    leftIcon={<TrendingDown size={16} className="text-rose-500" />}
                                >
                                    Satım
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 border-l border-[var(--color-border)] pl-4 ml-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--color-text-secondary)]">Tarih:</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                                    />
                                    <span className="text-[var(--color-text-secondary)]">-</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                                    />
                                    {(startDate || endDate) && (
                                        <button
                                            onClick={() => { setStartDate(''); setEndDate(''); }}
                                            className="p-1 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors"
                                            title="Tarihi Sıfırla"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Stats */}
                <motion.div variants={itemVariants}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Card variant="glass" className="border-0 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-sky-500/10">
                                    <TrendingUp size={18} className="text-sky-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--color-text-secondary)]">Toplam Alım</p>
                                    <p className="text-base font-bold text-[var(--color-text-primary)]">
                                        {formatCurrency(stats.totalBuy)}
                                    </p>
                                    <p className="text-[10px] text-[var(--color-text-secondary)]">{stats.buyCount} işlem</p>
                                </div>
                            </div>
                        </Card>
                        <Card variant="glass" className="border-0 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    stats.totalProfit >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
                                )}>
                                    <Calculator size={18} className={stats.totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"} />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--color-text-secondary)]">Satış Kar/Zarar</p>
                                    <p className={cn(
                                        "text-base font-bold",
                                        stats.totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {formatCurrency(stats.totalProfit)}
                                    </p>
                                    <p className="text-[10px] text-[var(--color-text-secondary)]">Gerçekleşen net kar</p>
                                </div>
                            </div>
                        </Card>
                        <Card variant="glass" className="border-0 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-sky-500/5 text-sky-500">
                                    <History size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--color-text-secondary)]">İşlem Sayısı</p>
                                    <p className="text-base font-bold text-[var(--color-text-primary)]">
                                        {filteredTransactions.length}
                                    </p>
                                    <p className="text-[10px] text-[var(--color-text-secondary)]">Filtrelenmiş</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </motion.div>

                {/* Transactions List */}
                <motion.div variants={itemVariants}>
                    <Card variant="glass" padding="none" className="border-0 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="hidden md:grid grid-cols-7 gap-4 px-5 py-3 bg-[var(--color-bg-tertiary)]/50 border-b border-[var(--color-border)]/50 text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                            <div>Tarih</div>
                            <div>Sembol</div>
                            <div>Tip</div>
                            <div>Adet</div>
                            <div>Fiyat</div>
                            <div>Tutar</div>
                            <div className="text-right">İşlemler</div>
                        </div>

                        {/* Transactions */}
                        <div className="divide-y divide-[var(--color-border)]/50">
                            {filteredTransactions.map((tx, index) => (
                                <motion.div
                                    key={tx.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="grid grid-cols-2 md:grid-cols-7 gap-4 px-5 py-3 hover:bg-[var(--color-bg-tertiary)]/20 transition-colors group"
                                >
                                    {/* Date */}
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-[var(--color-text-secondary)]" />
                                        <span className="text-sm text-[var(--color-text-primary)]">
                                            {formatDate(tx.date)}
                                        </span>
                                    </div>

                                    {/* Symbol */}
                                    <div>
                                        <p className="font-semibold text-[var(--color-text-primary)]">{tx.symbol}</p>
                                        <p className="text-xs text-[var(--color-text-secondary)] truncate max-w-[120px]">
                                            {tx.name}
                                        </p>
                                    </div>

                                    {/* Type */}
                                    <div className="hidden md:flex items-center">
                                        <span className={cn(
                                            'px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 inline-flex',
                                            tx.type === 'buy'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                        )}>
                                            {tx.type === 'buy' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {tx.type === 'buy' ? 'ALIŞ' : 'SATIŞ'}
                                        </span>
                                    </div>

                                    {/* Quantity */}
                                    <div className="hidden md:flex items-center">
                                        <span className={cn(
                                            "text-sm font-medium",
                                            tx.type === 'buy' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'
                                        )}>
                                            {tx.type === 'buy' ? '+' : '-'}{tx.quantity.toLocaleString('tr-TR', { maximumFractionDigits: 3 })}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="hidden md:flex items-center">
                                        <span className="text-sm text-[var(--color-text-secondary)]">
                                            {formatCurrency(tx.price)}
                                        </span>
                                    </div>

                                    {/* Total */}
                                    <div className="flex items-center justify-end md:justify-start">
                                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                            {formatCurrency(tx.total)}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingTx(tx)}
                                            className="p-1.5 rounded-lg hover:bg-sky-500/10 text-[var(--color-text-secondary)] hover:text-sky-500 transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit3 size={15} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingTx(tx)}
                                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--color-text-secondary)] hover:text-rose-500 transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            {filteredTransactions.length === 0 && (
                                <div className="px-6 py-12 text-center">
                                    <Package size={32} className="mx-auto text-[var(--color-text-secondary)] mb-3" />
                                    <p className="text-[var(--color-text-secondary)] font-medium">
                                        {searchTerm
                                            ? 'Arama kriterlerine uygun işlem bulunamadı'
                                            : 'Henüz işlem bulunmuyor'}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-3">
                                        Yeni işlem eklemek için üst menüyü kullanabilirsiniz.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {editingTx && (
                    <EditTransactionModal
                        transaction={editingTx}
                        onClose={() => setEditingTx(null)}
                        onSave={handleEditSave}
                    />
                )}
                {deletingTx && (
                    <DeleteConfirmModal
                        transaction={deletingTx}
                        onClose={() => setDeletingTx(null)}
                        onConfirm={handleDelete}
                    />
                )}
            </AnimatePresence>
        </>
    );
});

HistoryPage.displayName = 'HistoryPage';

export default HistoryPage;

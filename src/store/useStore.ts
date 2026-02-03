import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface PortfolioSummary {
    total_value: number;
    total_value_usd: number;
    unrealized_pnl: number;
    realized_pnl: number;
    total_return: number;
    roi_pct: number;
    holdings_count: number;
    top_performer: string;
    worst_performer: string;
    last_updated?: string;
    daily_change: number;
    daily_change_pct: number;
    weekly_change: number;
    weekly_change_pct: number;
    monthly_change: number;
    monthly_change_pct: number;
}

export interface Holding {
    symbol: string;
    name: string;
    asset_type: string;
    quantity: number;
    avg_cost: number;
    current_price: number;
    value: number;
    pnl: number;
    pnl_pct: number;
}

export interface Transaction {
    id: string;
    date: string;
    symbol: string;
    name: string;
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    total: number;
    notes?: string;
}

export interface LastUpdates {
    tefas: string | null;
    market: string | null;
}

interface PortfolioStore {
    summary: PortfolioSummary | null;
    holdings: Holding[];
    transactions: Transaction[];
    lastUpdates: LastUpdates;
    loading: boolean;
    loadingGeneral: boolean;
    loadingTefas: boolean;
    fetchData: () => Promise<void>;
    fetchTransactions: () => Promise<void>;
    fetchLastUpdates: () => Promise<void>;
    updateMarketData: (type: 'general' | 'tefas', force?: boolean) => Promise<void>;
    backupPath: string | null;
    setBackupPath: (path: string | null) => void;
    triggerAutoBackup: () => Promise<void>;
}

export const useStore = create<PortfolioStore>((set, get) => ({
    summary: null,
    holdings: [],
    transactions: [],
    lastUpdates: { tefas: null, market: null },
    loading: false,
    loadingGeneral: false,
    loadingTefas: false,
    fetchData: async () => {
        set({ loading: true });
        try {
            const summary = await invoke<PortfolioSummary>('get_summary');
            const holdings = await invoke<Holding[]>('get_holdings');
            set({ summary, holdings, loading: false });
            // Also fetch transactions and updates
            get().fetchTransactions();
            get().fetchLastUpdates();
        } catch (error) {
            console.error('Fetch error:', error);
            set({ loading: false });
        }
    },
    fetchTransactions: async () => {
        try {
            const transactions = await invoke<Transaction[]>('get_transactions');
            set({ transactions });
        } catch (error) {
            console.error('Fetch transactions error:', error);
            set({ transactions: [] });
        }
    },
    fetchLastUpdates: async () => {
        try {
            const updates = await invoke<LastUpdates>('get_last_updates');
            set({ lastUpdates: updates });
        } catch (error) {
            console.error('Fetch updates error:', error);
        }
    },
    updateMarketData: async (type, force = false) => {
        if (type === 'general') {
            set({ loadingGeneral: true });
        } else {
            set({ loadingTefas: true });
        }

        try {
            await invoke('update_market_data', { updateType: type, force });
            await get().fetchData();
        } catch (error) {
            console.error('Update error:', error);
        } finally {
            if (type === 'general') {
                set({ loadingGeneral: false });
            } else {
                set({ loadingTefas: false });
            }
        }
    },
    backupPath: localStorage.getItem('auto_backup_path'),
    setBackupPath: (path) => {
        if (path) {
            localStorage.setItem('auto_backup_path', path);
        } else {
            localStorage.removeItem('auto_backup_path');
        }
        set({ backupPath: path });
    },
    triggerAutoBackup: async () => {
        const { backupPath } = get();
        if (!backupPath) return;

        try {
            const data = await invoke<string>('export_database_json');
            // use dynamic imports for tauri plugins to avoid issues if not loaded
            const { writeTextFile } = await import('@tauri-apps/plugin-fs');
            const { join } = await import('@tauri-apps/api/path');

            const filePath = await join(backupPath, 'tefas_auto_backup.json');
            await writeTextFile(filePath, data);
            console.log('Auto-backup completed to:', filePath);
        } catch (error) {
            console.error('Auto-backup failed:', error);
        }
    }
}));

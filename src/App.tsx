import { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { useStore } from './store/useStore';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/layout';
import Header from './components/layout/Header';
import AddTransactionModal from './components/AddTransactionModal';
import { useTheme } from './hooks/useTheme';
import type { Holding } from './store/useStore';
import './index.css';

// Lazy load pages for code splitting
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-96">
    <div className="animate-spin h-8 w-8 border-2 border-[var(--color-accent-blue)] border-t-transparent rounded-full" />
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');

  const { summary, holdings, fetchData, updateMarketData, loading, loadingGeneral, loadingTefas } = useStore();
  const { resolvedTheme } = useTheme();

  // Auto-fetch market data on app load
  useEffect(() => {
    const initializeData = async () => {
      console.log('[APP] Starting initialization...');

      // 1. Show existing data immediately
      await fetchData();

      // 2. Update market data in background
      try {
        console.log('[APP] Updating market data in background...');

        // General data
        await updateMarketData('general', false);

        // Portfolio assets (TEFAS)
        await updateMarketData('tefas', false);

        console.log('[APP] Market data updated, refreshing view...');
        // 3. Refresh view with new data
        await fetchData();
      } catch (err) {
        console.error('[APP] Failed to update market data:', err);
      }
    };

    initializeData();
  }, [fetchData]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('[APP] Auto-refreshing market data...');
      try {
        await invoke('update_market_data', { updateType: 'all', force: false });
        await fetchData();
      } catch (err) {
        console.error('[APP] Auto-refresh failed:', err);
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleUpdateMarkets = useCallback(async () => {
    try {
      await updateMarketData('general', true);
      await updateMarketData('tefas', true);
    } catch (err) {
      console.error('[APP] Market update failed:', err);
    }
  }, [updateMarketData]);

  const handleUpdateTefas = useCallback(async () => {
    try {
      await updateMarketData('tefas', true);
    } catch (err) {
      console.error('[APP] TEFAS update failed:', err);
    }
  }, [updateMarketData]);

  const handleViewHistory = useCallback((symbol: string) => {
    setHistoryFilter(symbol);
    setActiveTab('history');
  }, []);

  const [presetSymbol, setPresetSymbol] = useState<string | undefined>(undefined);
  const [presetType, setPresetType] = useState<'buy' | 'sell' | undefined>(undefined);

  const handleAddPresetTransaction = useCallback((symbol: string, type: 'buy' | 'sell') => {
    setPresetSymbol(symbol);
    setPresetType(type);
    setShowAddTransactionModal(true);
  }, []);

  const handleAddTransactionClick = useCallback(() => {
    setPresetSymbol(undefined);
    setPresetType(undefined);
    setShowAddTransactionModal(true);
  }, []);

  const handleAddModalClose = useCallback(() => {
    setShowAddTransactionModal(false);
    setPresetSymbol(undefined);
    setPresetType(undefined);
  }, []);

  // Get transactions and lastUpdates from store
  const { transactions, fetchTransactions, lastUpdates } = useStore();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'portfolio': return 'Portföyüm';
      case 'history': return 'İşlem Geçmişi';
      case 'analytics': return 'Analiz';
      case 'settings': return 'Ayarlar';
      default: return 'Portföyüm';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'portfolio':
        return (
          <PortfolioPage
            holdings={holdings}
            summary={summary}
            lastUpdates={lastUpdates}
            transactions={transactions}
            onViewHistory={handleViewHistory}
            onAddTransaction={handleAddPresetTransaction}
            isLoading={loading || loadingGeneral || loadingTefas}
          />
        );
      case 'history':
        return <HistoryPage transactions={transactions} holdings={holdings} onRefresh={fetchTransactions} initialSearchTerm={historyFilter} />;
      case 'analytics':
        return <AnalyticsPage summary={summary} holdings={holdings} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <PortfolioPage
            holdings={holdings}
            summary={summary}
            lastUpdates={lastUpdates}
            transactions={transactions}
            onViewHistory={handleViewHistory}
            onAddTransaction={handleAddPresetTransaction}
            isLoading={loading || loadingGeneral || loadingTefas}
          />
        );
    }
  };

  return (
    <div className="flex w-full h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Ana içeriğe atla
      </a>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'history') {
            setHistoryFilter('');
          }
        }}
        isLoading={loading}
        onRefresh={fetchData}
      />

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--color-accent-blue)]/5 via-transparent to-transparent"
        role="main"
        aria-label="Main content"
      >
        <Header
          title={getPageTitle()}
          subtitle={activeTab === 'portfolio' ? 'PRO' : undefined}
          onAddTransaction={handleAddTransactionClick}
          onUpdateMarkets={activeTab === 'portfolio' ? handleUpdateMarkets : undefined}
          onUpdateTefas={activeTab === 'portfolio' ? handleUpdateTefas : undefined}
          isLoadingMarkets={loadingGeneral}
          isLoadingTefas={loadingTefas}
          lastUpdated={summary?.last_updated}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<PageLoader />}>
              {renderContent()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showAddTransactionModal && (
          <AddTransactionModal
            onClose={handleAddModalClose}
            initialSymbol={presetSymbol}
            initialType={presetType}
            onSave={() => {
              fetchData();
              handleAddModalClose();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

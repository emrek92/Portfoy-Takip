import React, { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { X, Save, AlertTriangle } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Autocomplete from './ui/Autocomplete';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

interface AddTransactionModalProps {
    onClose: () => void;
    onSave?: () => void;
    initialSymbol?: string;
    initialType?: 'buy' | 'sell';
}

const AddTransactionModal = memo<AddTransactionModalProps>(({ onClose, onSave, initialSymbol, initialType }) => {
    const { holdings } = useStore();
    const overlayRef = React.useRef<HTMLDivElement>(null);

    const handleOverlayClick = (e: React.MouseEvent) => {
        // Only close if clicking directly on the overlay, not its children
        if (e.target === overlayRef.current) {
            onClose();
        }
    };
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        symbol: initialSymbol || '',
        name: '',
        asset_type: 'fon',
        transaction_type: initialType || 'buy',
        quantity: 0,
        price: 0,
        notes: '',
    });

    // Auto-fill data when initialSymbol changes or on initial mount
    useEffect(() => {
        if (initialSymbol) {
            const existingHolding = holdings.find(h => h.symbol === initialSymbol.toUpperCase());
            if (existingHolding) {
                setFormData(prev => ({
                    ...prev,
                    symbol: initialSymbol.toUpperCase(),
                    name: existingHolding.name,
                    price: existingHolding.current_price,
                    asset_type: existingHolding.asset_type,
                    transaction_type: initialType || prev.transaction_type
                }));
            }
        }
    }, [initialSymbol, initialType, holdings]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isLoadingAsset, setIsLoadingAsset] = useState(false);
    const symbolTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSymbolChange = (symbol: string) => {
        const upperSymbol = symbol.toUpperCase();

        // Update symbol immediately
        setFormData(prev => ({ ...prev, symbol: upperSymbol }));

        // Note: The previous logic that checked 'holdings' and fetched 'get_asset_info' 
        // is now largely superseded by the Autocomplete's onSelect. 
        // However, we still might want to check holdings if the user types manually without selecting.
        // But for "autocomplete" feature, the onSelect handles the main logic.
        // We will keep the manual type-in basic for now, or we could keep the 'onBlur' behavior if needed.
    };

    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (symbolTimeoutRef.current) {
                clearTimeout(symbolTimeoutRef.current);
            }
        };
    }, []);

    const handleSave = async () => {
        if (!formData.symbol || formData.quantity <= 0 || formData.price <= 0) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }

        setIsSubmitting(true);
        try {
            await invoke('add_transaction', {
                transaction: {
                    date: formData.date,
                    symbol: formData.symbol,
                    name: formData.name || formData.symbol,
                    asset_type: formData.asset_type,
                    transaction_type: formData.transaction_type,
                    quantity: formData.quantity,
                    price: formData.price,
                    notes: formData.notes || null,
                }
            });
            await useStore.getState().triggerAutoBackup();
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error('Add transaction failed:', error);
            alert('İşlem eklenemedi: ' + error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const total = formData.quantity * formData.price;

    return (
        <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleOverlayClick}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg-secondary)] z-10">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Yeni İşlem Ekle</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors text-[var(--color-text-secondary)]">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Tarih</label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-secondary)]">İşlem Tipi</label>
                            <div className="flex bg-[var(--color-bg-tertiary)] rounded-xl p-1">
                                <button
                                    className={cn(
                                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                        formData.transaction_type === 'buy'
                                            ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
                                            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                    )}
                                    onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'buy' }))}
                                >
                                    Alış
                                </button>
                                <button
                                    className={cn(
                                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                        formData.transaction_type === 'sell'
                                            ? "bg-rose-500/10 text-rose-500 shadow-sm"
                                            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                    )}
                                    onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'sell' }))}
                                >
                                    Satış
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Varlık Tipi</label>
                        <select
                            value={formData.asset_type}
                            onChange={(e) => setFormData(prev => ({ ...prev, asset_type: e.target.value }))}
                            className="w-full p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none"
                        >
                            <option value="fon">Yatırım Fonu (TEFAS)</option>
                            <option value="hisse">Hisse Senedi</option>
                            <option value="altin">Altın / Kıymetli Maden</option>
                            <option value="doviz">Döviz</option>
                            <option value="kripto">Kripto Para</option>
                            <option value="diger">Diğer</option>
                        </select>
                    </div>

                    <div className="space-y-2">

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Sembol / Kod</label>
                            <div className="relative">
                                <Autocomplete
                                    value={formData.symbol}
                                    onChange={(value) => handleSymbolChange(value)}
                                    onSelect={(asset: any) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            symbol: asset.symbol,
                                            name: asset.name,
                                            price: asset.current_price,
                                            asset_type: asset.asset_type
                                        }));
                                    }}
                                    fetchOptions={async (query) => {
                                        if (query.length < 1) return [];
                                        try {
                                            const results = await invoke<any[]>('search_assets', { query });
                                            return results || [];
                                        } catch (e) {
                                            console.error(e);
                                            return [];
                                        }
                                    }}
                                    getOptionLabel={(asset) => asset.symbol}
                                    renderOption={(asset) => (
                                        <div className="flex justify-between w-full">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[var(--color-text-primary)]">{asset.symbol}</span>
                                                <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-[200px]">{asset.name}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(asset.current_price)}
                                                </span>
                                                <span className="text-xs text-[var(--color-text-secondary)] uppercase">{asset.asset_type}</span>
                                            </div>
                                        </div>
                                    )}
                                    placeholder="Örn: TCD, THYAO, USD/TRY..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-secondary)]">İsim (Opsiyonel)</label>
                            <Input
                                placeholder="Varlık adı..."
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">Miktar</label>
                                    {formData.transaction_type === 'sell' && (
                                        <span className="text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                            Elde: {holdings.find(h => h.symbol === formData.symbol.toUpperCase())?.quantity || 0}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.000001"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Birim Fiyat</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.000001"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-xl flex justify-between items-center">
                            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Toplam Tutar</span>
                            <span className="text-lg font-bold text-[var(--color-text-primary)]">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(total)}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Notlar</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none resize-none h-20"
                                placeholder="İşlem ile ilgili notlar..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] sticky bottom-0 flex justify-end gap-3 z-10">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        İptal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isSubmitting}
                        leftIcon={<Save size={18} />}
                    >
                        {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
});

AddTransactionModal.displayName = 'AddTransactionModal';

export default AddTransactionModal;

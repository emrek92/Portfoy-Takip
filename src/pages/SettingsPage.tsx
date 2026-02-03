import React, { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import {
    Moon,
    Sun,
    Monitor,
    Globe,
    Trash2,
    Download,
    Upload,
    FileJson,
    Cloud,
    CloudOff,
    RefreshCw,
    Database,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/useStore';

export interface SettingsPageProps {
    onClearData?: () => void;
    onExportData?: () => void;
    onImportData?: () => void;
}

type Theme = 'light' | 'dark' | 'system';
type ExportFormat = 'json';

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

const SettingsPage = memo<SettingsPageProps>(function SettingsPage() {
    const { theme, setTheme } = useTheme();
    // Removed auto-update state and logic
    const { fetchData, fetchLastUpdates, backupPath, setBackupPath, triggerAutoBackup } = useStore();

    // Initial fetch of update times - can be kept if needed for other features in future
    useEffect(() => {
        fetchLastUpdates();
    }, [fetchLastUpdates]);

    // Removed manual update logic & format helper as they are no longer used

    // Export functions
    const handleExport = async (format: ExportFormat) => {
        try {
            console.log('Starting export...', format);
            const json = await invoke<string>('export_database_json');
            console.log('Export data received:', json.substring(0, 100));
            const data = JSON.parse(json);

            let content: string;
            let defaultName: string;
            let filterName: string;
            let extensions: string[];
            const dateStr = new Date().toISOString().split('T')[0];

            if (format === 'json') {
                content = JSON.stringify(data, null, 2);
                defaultName = `tefas_yedek_${dateStr}.json`;
                filterName = 'JSON';
                extensions = ['json'];
            } else {
                return;
            }

            // Use Tauri dialog to save file
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeTextFile } = await import('@tauri-apps/plugin-fs');

            const filePath = await save({
                defaultPath: defaultName,
                filters: [{ name: filterName, extensions }]
            });

            if (filePath) {
                await writeTextFile(filePath, content);
                alert('Dosya başarıyla kaydedildi: ' + filePath);
            }

            console.log('Export completed:', filePath);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Dışa aktarma başarısız: ' + String(error));
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                await invoke('import_database_json', { jsonData: json });
                await useStore.getState().triggerAutoBackup();
                alert('Veriler başarıyla içe aktarıldı!');
                fetchData();
            } catch (error) {
                console.error('Import failed:', error);
                alert('İçe aktarma hatası: ' + error);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const handleClear = async () => {
        if (window.confirm('Tüm veriler silinecek! Bu işlem geri alınamaz. Emin misiniz?')) {
            try {
                await invoke('clear_database');
                await useStore.getState().triggerAutoBackup();
                alert('Veriler silindi.');
                fetchData();
            } catch (error) {
                alert('Silme hatası: ' + error);
            }
        }
    };

    const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
        { value: 'light', label: 'Açık', icon: Sun },
        { value: 'dark', label: 'Koyu', icon: Moon },
        { value: 'system', label: 'Sistem', icon: Monitor },
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
        >
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Appearance */}
                <motion.div variants={itemVariants}>
                    <Card variant="glass" className="h-full">
                        <CardHeader title="Görünüm" subtitle="Uygulama temasını ayarlayın" />
                        <CardContent>
                            <div className="flex bg-[var(--color-bg-tertiary)] p-1 rounded-xl">
                                {themeOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isActive = theme === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => setTheme(option.value)}
                                            className={cn(
                                                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all',
                                                isActive
                                                    ? 'bg-[var(--color-bg-primary)] text-sky-500 shadow-sm'
                                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                            )}
                                        >
                                            <Icon size={14} />
                                            <span className="text-xs font-medium">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* About - Moved here for layout balance */}
                <motion.div variants={itemVariants}>
                    <Card variant="glass" className="h-full">
                        <CardHeader title="Hakkında" />
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-center mt-1">
                                <div>
                                    <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-tight">Versiyon</p>
                                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">1.0.0</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-tight">Geliştirici</p>
                                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">emrek92</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-tight">Lisans</p>
                                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">MIT</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Auto Updates Removed */}

            {/* Data Management */}
            <motion.div variants={itemVariants}>
                <Card variant="glass">
                    <CardHeader title="Veri Yönetimi" subtitle="Veritabanınızı yedekleyin veya eski verileri geri yükleyin" />
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Backup Section */}
                            <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10 space-y-3">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                                        <FileJson size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[var(--color-text-primary)]">Veritabanını Yedekle</p>
                                        <p className="text-[11px] text-[var(--color-text-secondary)]">Tüm verilerinizi JSON formatında dışa aktarın</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleExport('json')}
                                    variant="secondary"
                                    className="w-full bg-sky-500 text-white hover:bg-sky-600 border-0"
                                    leftIcon={<Download size={16} />}
                                >
                                    JSON Olarak Kaydet
                                </Button>
                            </div>

                            {/* Restore & Reset Section */}
                            <div className="p-4 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] space-y-3">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                        <Upload size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[var(--color-text-primary)]">Verileri Geri Yükle</p>
                                        <p className="text-[11px] text-[var(--color-text-secondary)]">JSON yedeğinden tüm işlemlerinizi içe aktarın</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <label className="flex-1">
                                        <input
                                            type="file"
                                            accept=".json"
                                            className="hidden"
                                            onChange={handleImport}
                                        />
                                        <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-primary)] transition-all cursor-pointer text-xs font-medium text-[var(--color-text-primary)]">
                                            İçe Aktar
                                        </div>
                                    </label>
                                    <button
                                        onClick={handleClear}
                                        className="px-3 py-2 rounded-xl border border-rose-500/30 hover:bg-rose-500/5 transition-all text-rose-500 text-xs font-medium"
                                    >
                                        Sıfırla
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Google Drive Auto-Backup */}
            <motion.div variants={itemVariants}>
                <Card variant="glass">
                    <CardHeader
                        title="Otomatik Bulut Yedekleme"
                        subtitle="Google Drive veya Dropbox klasörünüzü seçerek verilerinizi otomatik yedekleyin"
                    />
                    <CardContent>
                        <div className="mb-4 p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl flex gap-3">
                            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 h-fit">
                                <Monitor size={16} />
                            </div>
                            <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                                <span className="font-bold text-sky-500 block mb-1">💡 Nasıl Kullanılır?</span>
                                Bilgisayarınızda yüklü olan <span className="text-[var(--color-text-primary)] font-medium">Google Drive, Dropbox veya iCloud</span> klasörünü seçin.
                                Bu sayede yaptığınız her işlem anında o klasöre yedeklenir ve bulut hesabınızla otomatik olarak senkronize edilir.
                            </p>
                        </div>
                        <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-2xl border border-[var(--color-border)]">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-xl",
                                        backupPath ? "bg-emerald-500/10 text-emerald-500" : "bg-sky-500/10 text-sky-500"
                                    )}>
                                        {backupPath ? <Cloud size={20} /> : <CloudOff size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[var(--color-text-primary)]">Yedekleme Durumu</p>
                                        <p className="text-xs text-[var(--color-text-secondary)] truncate">
                                            {backupPath ? backupPath : 'Klasör seçilmedi'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={async () => {
                                            const { open } = await import('@tauri-apps/plugin-dialog');
                                            const selected = await open({
                                                directory: true,
                                                multiple: false,
                                                title: 'Yedekleme Klasörü Seç (Google Drive klasörünüzü seçin)'
                                            });
                                            if (selected) {
                                                setBackupPath(selected as string);
                                                await triggerAutoBackup();
                                                alert('Otomatik yedekleme aktifleşti!');
                                            }
                                        }}
                                    >
                                        Klasör Seç
                                    </Button>
                                    {backupPath && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-rose-500 hover:bg-rose-500/10"
                                            onClick={() => {
                                                if (confirm('Otomatik yedeklemeyi kapatmak istediğinize emin misiniz?')) {
                                                    setBackupPath(null);
                                                }
                                            }}
                                        >
                                            Kapat
                                        </Button>
                                    )}
                                </div>
                            </div>

            {backupPath && (
                                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                                    <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-medium uppercase tracking-wider">
                                        <CheckCircle2 size={12} />
                                        <span>Aktif: Her işlem sonrası otomatik yedeklenir</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* API Debug Panel */}
            <motion.div variants={itemVariants}>
                <Card variant="glass">
                    <CardHeader 
                        title="🔧 API Veri Kaynağı (Debug)" 
                        subtitle="Piyasa verilerinin nereden çekildiğini kontrol edin" 
                    />
                    <CardContent>
                        <div className="space-y-4">
                            {/* API Source Info */}
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                        <Globe size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[var(--color-text-primary)]">Aktif Veri Kaynağı</p>
                                        <p className="text-[11px] text-emerald-500 font-mono">https://borsapy-api.onrender.com</p>
                                    </div>
                                </div>
                                <div className="text-[11px] text-[var(--color-text-secondary)] space-y-1">
                                    <p>📈 Hisseler: <code className="text-sky-400">/stocks/{'{symbol}'}/info</code></p>
                                    <p>📊 Endeksler: <code className="text-sky-400">/indices/{'{symbol}'}/info</code></p>
                                    <p>💰 Fonlar: <code className="text-sky-400">/funds/{'{code}'}/info</code></p>
                                    <p>💱 Döviz: <code className="text-sky-400">/fx/{'{symbol}'}/current</code></p>
                                    <p>🪙 Kripto: <code className="text-sky-400">/crypto/{'{symbol}'}/current</code></p>
                                </div>
                            </div>

                            {/* Test API Button */}
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                    leftIcon={<RefreshCw size={14} />}
                                    onClick={async () => {
                                        try {
                                            console.log('[DEBUG] Testing API connection...');
                                            const startTime = Date.now();
                                            
                                            // Force update to trigger API calls
                                            await invoke('update_market_data', { updateType: 'general', force: true });
                                            
                                            const elapsed = Date.now() - startTime;
                                            console.log(`[DEBUG] API call completed in ${elapsed}ms`);
                                            alert(`✅ API bağlantısı başarılı!\n\nSüre: ${elapsed}ms\nKaynak: borsapy-api.onrender.com\n\nTerminalde [API_CLIENT] loglarını kontrol edin.`);
                                            
                                            await fetchData();
                                        } catch (error) {
                                            console.error('[DEBUG] API test failed:', error);
                                            alert('❌ API bağlantısı başarısız: ' + error);
                                        }
                                    }}
                                >
                                    API Bağlantısını Test Et
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        window.open('https://borsapy-api.onrender.com/docs', '_blank');
                                    }}
                                >
                                    API Docs
                                </Button>
                            </div>

                            {/* Info Box */}
                            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                                        <span className="font-bold text-amber-500">Not:</span> API çağrıları terminalde <code className="text-sky-400">[API_CLIENT]</code> prefix'i ile loglanır. 
                                        Verilerin gerçekten API'den geldiğini doğrulamak için terminali kontrol edin.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>



        </motion.div>
    );
});

SettingsPage.displayName = 'SettingsPage';

export default SettingsPage;

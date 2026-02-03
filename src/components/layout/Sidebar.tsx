import React, { memo } from 'react';
import { cn } from '../../lib/utils';
import {
    Wallet,
    History,
    PieChart,
    Settings,
    RefreshCw,
} from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

export interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
}

export interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isLoading?: boolean;
    onRefresh?: () => void;
    className?: string;
}

const navItems: NavItem[] = [
    { id: 'portfolio', label: 'Portföyüm', icon: Wallet },
    { id: 'history', label: 'İşlem Geçmişi', icon: History },
    { id: 'analytics', label: 'Analiz', icon: PieChart },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
];

const Sidebar = memo<SidebarProps>(
    ({ activeTab, onTabChange, className }) => {
        return (
            <aside
                className={cn(
                    'w-64 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]',
                    'flex flex-col p-6',
                    className
                )}
                role="navigation"
                aria-label="Main navigation"
            >
                {/* Logo */}
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div
                        className="w-8 h-8 rounded-lg bg-[var(--color-accent-blue)] flex items-center justify-center font-bold text-white shadow-lg"
                        style={{ boxShadow: '0 4px 14px 0 var(--color-accent-blue)' }}
                        aria-hidden="true"
                    >
                        A
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                        PORTFÖY YÖNETİMİ
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1" role="menubar" aria-label="Main menu">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                role="menuitem"
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
                                    isActive
                                        ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] font-semibold'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                                )}
                            >
                                <Icon size={20} aria-hidden="true" />
                                <span>{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span
                                        className="ml-auto bg-[var(--color-accent-blue)] text-white text-xs font-bold px-2 py-0.5 rounded-full"
                                        aria-label={`${item.badge} notifications`}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="pt-6 border-t border-[var(--color-border)]">
                    <div className="flex justify-center">
                        <ThemeToggle variant="segmented" size="sm" showLabels={false} />
                    </div>
                </div>
            </aside>
        );
    }
);

Sidebar.displayName = 'Sidebar';

export default Sidebar;

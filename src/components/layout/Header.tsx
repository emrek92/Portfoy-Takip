import React, { memo } from 'react';
import { cn, formatDate } from '../../lib/utils';
import Button from '../ui/Button';
import {
    PlusCircle,
    Database,
} from 'lucide-react';

export interface HeaderProps {
    title: string;
    subtitle?: string;
    onAddTransaction?: () => void;
    onUpdateTefas?: () => void;
    onUpdateMarkets?: () => void;
    isLoadingTefas?: boolean;
    isLoadingMarkets?: boolean;
    className?: string;
    lastUpdated?: string;
}

const Header = memo<HeaderProps>(
    ({
        title,
        subtitle,
        onAddTransaction,
        onUpdateTefas,
        onUpdateMarkets,
        isLoadingTefas = false,
        isLoadingMarkets = false,
        className,
        lastUpdated,
    }) => {
        const currentDate = formatDate(new Date());

        const formattedLastUpdated = lastUpdated
            ? new Date(lastUpdated).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            : null;

        return (
            <header
                className={cn(
                    'flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10',
                    className
                )}
            >
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
                        {title}
                    </h2>
                    <p className="flex items-center gap-2 text-[var(--color-text-secondary)] mt-1">
                        <span>{subtitle || currentDate}</span>
                        {formattedLastUpdated && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-[var(--color-text-secondary)]" />
                                <span className="text-sm">Son Veri: {formattedLastUpdated}</span>
                            </>
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                    {onUpdateMarkets && (
                        <Button
                            variant="outline"
                            size="md"
                            onClick={onUpdateMarkets}
                            isLoading={isLoadingMarkets}
                            className="text-xs"
                            leftIcon={<Database size={16} />}
                        >
                            Piyasaları Güncelle
                        </Button>
                    )}

                    {onUpdateTefas && (
                        <Button
                            variant="outline"
                            size="md"
                            onClick={onUpdateTefas}
                            isLoading={isLoadingTefas}
                            className="text-xs"
                            leftIcon={<Database size={16} />}
                        >
                            TEFAS Güncelle
                        </Button>
                    )}

                    {onAddTransaction && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={onAddTransaction}
                            leftIcon={<PlusCircle size={18} />}
                        >
                            İşlem Ekle
                        </Button>
                    )}
                </div>
            </header>
        );
    }
);

Header.displayName = 'Header';

export default Header;

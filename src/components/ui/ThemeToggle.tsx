import React, { memo } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';
import Button from './Button';

export interface ThemeToggleProps {
    variant?: 'icon' | 'segmented';
    size?: 'sm' | 'md' | 'lg';
    showLabels?: boolean;
}

const ThemeToggle = memo<ThemeToggleProps>(({ variant = 'icon', size = 'md', showLabels = true }) => {
    const { theme, resolvedTheme, setTheme } = useTheme();

    const iconSizes = {
        sm: 14,
        md: 18,
        lg: 22,
    };

    const iconSize = iconSizes[size];

    if (variant === 'segmented') {
        return (
            <div
                className="inline-flex items-center p-1 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border)]"
                role="radiogroup"
                aria-label="Theme selection"
            >
                <Button
                    variant={theme === 'light' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    aria-label="Açık tema"
                    className={cn(
                        "transition-all px-3",
                        theme === 'light' ? 'bg-[var(--color-bg-primary)] text-sky-500 shadow-sm' : 'text-[var(--color-text-secondary)]'
                    )}
                >
                    <Sun size={iconSize} />
                    {showLabels && <span className="ml-2 text-[11px] font-medium">Açık</span>}
                </Button>
                <Button
                    variant={theme === 'system' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    aria-label="Sistem teması"
                    className={cn(
                        "transition-all px-3",
                        theme === 'system' ? 'bg-[var(--color-bg-primary)] text-sky-500 shadow-sm' : 'text-[var(--color-text-secondary)]'
                    )}
                >
                    <Monitor size={iconSize} />
                    {showLabels && <span className="ml-2 text-[11px] font-medium">Sistem</span>}
                </Button>
                <Button
                    variant={theme === 'dark' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    aria-label="Koyu tema"
                    className={cn(
                        "transition-all px-3",
                        theme === 'dark' ? 'bg-[var(--color-bg-primary)] text-sky-500 shadow-sm' : 'text-[var(--color-text-secondary)]'
                    )}
                >
                    <Moon size={iconSize} />
                    {showLabels && <span className="ml-2 text-[11px] font-medium">Koyu</span>}
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant="ghost"
            size={size}
            onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        >
            {resolvedTheme === 'light' ? <Moon size={iconSize} /> : <Sun size={iconSize} />}
        </Button>
    );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;

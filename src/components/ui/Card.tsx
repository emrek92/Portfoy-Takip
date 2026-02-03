import React, { forwardRef, memo } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        { className, variant = 'default', padding = 'md', hover = false, children, ...props },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-xl transition-all duration-300',
                    {
                        'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-card':
                            variant === 'default',
                        'glass': variant === 'glass',
                        'bg-[var(--color-surface-elevated)] shadow-lg border border-[var(--color-border)]':
                            variant === 'elevated',
                    },
                    {
                        'p-0': padding === 'none',
                        'p-4': padding === 'sm',
                        'p-6': padding === 'md',
                        'p-8': padding === 'lg',
                    },
                    hover && 'hover:shadow-xl hover:shadow-black/10 cursor-pointer active:scale-[0.99]',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, title, subtitle, action, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'flex items-start justify-between gap-4 pb-4 border-b border-[var(--color-border)]',
                    className
                )}
                {...props}
            >
                <div className="flex-1 min-w-0">
                    {title && (
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] truncate">
                            {title}
                        </h3>
                    )}
                    {subtitle && (
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
                    )}
                    {children}
                </div>
                {action && <div className="flex-shrink-0">{action}</div>}
            </div>
        );
    }
);

CardHeader.displayName = 'CardHeader';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { }

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div ref={ref} className={cn('pt-4', className)} {...props}>
                {children}
            </div>
        );
    }
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'flex items-center justify-end gap-3 pt-4 mt-4 border-t border-[var(--color-border)]',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
export default memo(Card);

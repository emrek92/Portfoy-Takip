import React, { forwardRef, memo } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            ...props
        },
        ref
    ) => {

        const baseStyles = cn(
            'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            'active:scale-[0.98]',
            {
                'h-8 px-3 text-sm': size === 'sm',
                'h-10 px-4 text-base': size === 'md',
                'h-12 px-6 text-lg': size === 'lg',
            },
            {
                'bg-[var(--color-accent-blue)] text-white shadow-lg shadow-[var(--color-accent-blue)]/20 hover:bg-[var(--color-accent-blue)]/90':
                    variant === 'primary',
                'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-accent-blue)]/50':
                    variant === 'secondary',
                'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-bg-secondary)]':
                    variant === 'outline',
                'hover:bg-[var(--color-bg-secondary)]': variant === 'ghost',
                'bg-[var(--color-accent-red)] text-white hover:bg-[var(--color-accent-red)]/90':
                    variant === 'danger',
            },
            className
        );

        return (
            <button
                ref={ref}
                className={baseStyles}
                disabled={disabled || isLoading}
                aria-disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}
                {!isLoading && leftIcon}
                {children}
                {!isLoading && rightIcon}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default memo(Button);

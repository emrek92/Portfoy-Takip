import React, { forwardRef, memo } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    helperText?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        { className, label, helperText, error, leftIcon, rightIcon, id, ...props },
        ref
    ) => {
        const inputId = id || React.useId();
        const hasError = !!error;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'flex w-full rounded-xl border bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm',
                            'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]',
                            'transition-all duration-200',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            hasError
                                ? 'border-[var(--color-accent-red)] focus-visible:ring-[var(--color-accent-red)]'
                                : 'border-[var(--color-border)]',
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            className
                        )}
                        aria-invalid={hasError}
                        aria-describedby={
                            hasError
                                ? `${inputId}-error`
                                : helperText
                                    ? `${inputId}-helper`
                                    : undefined
                        }
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {hasError ? (
                    <p
                        id={`${inputId}-error`}
                        className="mt-1.5 text-sm text-[var(--color-accent-red)]"
                        role="alert"
                    >
                        {error}
                    </p>
                ) : helperText ? (
                    <p
                        id={`${inputId}-helper`}
                        className="mt-1.5 text-sm text-[var(--color-text-secondary)]"
                    >
                        {helperText}
                    </p>
                ) : null}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default memo(Input);

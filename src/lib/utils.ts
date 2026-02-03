import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single className string.
 * Uses clsx for conditional classes and tailwind-merge to resolve conflicts.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency with proper Turkish locale
 */
export function formatCurrency(value: number, currency: string = 'TRY'): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency === '₺' || currency === 'TRY' ? 'TRY' : 'USD',
    }).format(value);
}

/**
 * Formats a number as percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
    return `%${Math.abs(value).toFixed(decimals)}`;
}

/**
 * Formats a date to Turkish locale string
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generates a unique ID for accessibility attributes
 */
export function generateId(prefix: string = 'id'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Traps focus within a container for modal accessibility
 */
export function trapFocus(element: HTMLElement, event: KeyboardEvent) {
    const focusableElements = element.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === firstFocusable) {
            lastFocusable.focus();
            event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === lastFocusable) {
            firstFocusable.focus();
            event.preventDefault();
        }
    }
}
/**
 * Formats a date to YYYY-MM-DD for input[type="date"]
 */
export function formatDateForInput(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

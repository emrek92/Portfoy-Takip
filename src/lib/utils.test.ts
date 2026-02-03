import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatPercentage, formatDate, debounce, generateId } from './utils';

describe('cn', () => {
    it('merges class names correctly', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
        expect(cn('base', true && 'conditional')).toBe('base conditional');
        expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('handles undefined and null values', () => {
        expect(cn('base', undefined, null, 'valid')).toBe('base valid');
    });
});

describe('formatCurrency', () => {
    it('formats TRY currency correctly', () => {
        expect(formatCurrency(1000)).toBe('₺1.000,00');
        expect(formatCurrency(1000, 'TRY')).toBe('₺1.000,00');
        expect(formatCurrency(1000, '₺')).toBe('₺1.000,00');
    });

    it('formats USD currency correctly', () => {
        expect(formatCurrency(1000, 'USD')).toBe('$1.000,00');
        expect(formatCurrency(1000, '$')).toBe('$1.000,00');
    });

    it('handles negative values', () => {
        expect(formatCurrency(-500)).toBe('-₺500,00');
    });
});

describe('formatPercentage', () => {
    it('formats percentage correctly', () => {
        expect(formatPercentage(15.5)).toBe('%15.50');
        expect(formatPercentage(-10)).toBe('%10.00');
    });

    it('respects decimal places', () => {
        expect(formatPercentage(15.5555, 4)).toBe('%15.5555');
        expect(formatPercentage(15.5555, 0)).toBe('%16');
    });
});

describe('formatDate', () => {
    it('formats date string correctly', () => {
        const result = formatDate('2024-01-15');
        expect(result).toContain('15');
        expect(result).toContain('2024');
    });

    it('formats Date object correctly', () => {
        const date = new Date('2024-01-15');
        const result = formatDate(date);
        expect(result).toContain('15');
        expect(result).toContain('2024');
    });
});

describe('debounce', () => {
    it('delays function execution', async () => {
        let callCount = 0;
        const fn = () => { callCount++; };
        const debouncedFn = debounce(fn, 100);

        debouncedFn();
        debouncedFn();
        debouncedFn();

        expect(callCount).toBe(0);

        await new Promise(resolve => setTimeout(resolve, 150));
        expect(callCount).toBe(1);
    });
});

describe('generateId', () => {
    it('generates unique IDs', () => {
        const id1 = generateId();
        const id2 = generateId();
        expect(id1).not.toBe(id2);
    });

    it('includes prefix when provided', () => {
        const id = generateId('test');
        expect(id.startsWith('test-')).toBe(true);
    });
});

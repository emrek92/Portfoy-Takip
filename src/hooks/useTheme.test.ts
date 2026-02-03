import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

describe('useTheme', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    it('defaults to system theme', () => {
        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe('system');
    });

    it('loads theme from localStorage', () => {
        localStorage.setItem('app-theme-preference', 'dark');
        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe('dark');
    });

    it('sets theme to dark', () => {
        const { result } = renderHook(() => useTheme());

        act(() => {
            result.current.setTheme('dark');
        });

        expect(result.current.theme).toBe('dark');
        expect(result.current.resolvedTheme).toBe('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(localStorage.setItem).toHaveBeenCalledWith('app-theme-preference', 'dark');
    });

    it('sets theme to light', () => {
        const { result } = renderHook(() => useTheme());

        act(() => {
            result.current.setTheme('light');
        });

        expect(result.current.theme).toBe('light');
        expect(result.current.resolvedTheme).toBe('light');
        expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });

    it('toggles theme between light and dark', () => {
        const { result } = renderHook(() => useTheme());

        // Start with light
        act(() => {
            result.current.setTheme('light');
        });
        expect(result.current.resolvedTheme).toBe('light');

        // Toggle to dark
        act(() => {
            result.current.toggleTheme();
        });
        expect(result.current.theme).toBe('dark');
        expect(result.current.resolvedTheme).toBe('dark');

        // Toggle back to light
        act(() => {
            result.current.toggleTheme();
        });
        expect(result.current.theme).toBe('light');
        expect(result.current.resolvedTheme).toBe('light');
    });
});

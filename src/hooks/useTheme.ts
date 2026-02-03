import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface UseThemeReturn {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const STORAGE_KEY = 'app-theme-preference';

export function useTheme(): UseThemeReturn {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
            return stored || 'system';
        }
        return 'system';
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    const applyTheme = useCallback((newTheme: Theme) => {
        const root = document.documentElement;

        // Remove existing classes/attributes to prevent conflicts
        root.classList.remove('dark');

        const enableDark = () => {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
            setResolvedTheme('dark');
        };

        const enableLight = () => {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
            setResolvedTheme('light');
        };

        if (newTheme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            systemPrefersDark ? enableDark() : enableLight();
        } else if (newTheme === 'dark') {
            enableDark();
        } else {
            enableLight();
        }
    }, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, applyTheme]);

    const setTheme = useCallback((newTheme: Theme) => {
        localStorage.setItem(STORAGE_KEY, newTheme);
        setThemeState(newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }, [resolvedTheme, setTheme]);

    return {
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
    };
}

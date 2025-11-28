import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

        const handleChange = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? 'light' : 'dark');
        };

        mediaQuery.addEventListener('change', handleChange);

        // Apply to body
        document.documentElement.setAttribute('data-theme', theme);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return theme;
};

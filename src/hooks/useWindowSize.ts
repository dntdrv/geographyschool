import { useState, useEffect } from 'react';

interface WindowSize {
    width: number;
    height: number;
}

export const useWindowSize = (): WindowSize => {
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let timeoutId: number | undefined;

        function handleResize() {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = window.setTimeout(() => {
                setWindowSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
            }, 150);
        }

        window.addEventListener('resize', handleResize);

        // Initial call without debounce
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

    return windowSize;
};

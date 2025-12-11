import { useEffect } from 'react';

/**
 * Prevents zoom gestures on UI elements while allowing them on the map.
 * 
 * This hook tackles the problem that iOS Safari (since iOS 10) ignores
 * `user-scalable=no` and `maximum-scale=1` for accessibility reasons.
 * 
 * Strategy:
 * 1. Intercept touchmove events with 2+ touches (pinch gestures)
 * 2. Check if the target is inside the map container
 * 3. If NOT in map container, prevent the default zoom behavior
 * 4. Also prevent Ctrl+wheel zoom on UI elements
 */
export function usePreventUIZoom() {
    useEffect(() => {
        // Cache the map container selector for performance
        const isMapElement = (target: EventTarget | null): boolean => {
            if (!target || !(target instanceof Element)) return false;

            // Explicitly basic MapLibre UI elements that should NOT trigger map zoom
            // or should be treated as "UI" that we want to prevent default browser zoom on.
            if (
                target.closest('.maplibregl-popup') ||
                target.closest('.maplibregl-ctrl-group') ||
                target.closest('.maplibregl-ctrl-attrib')
            ) {
                return false;
            }

            // Allow gestures if target is the canvas or explicitly part of the map interaction layer
            // Markers are okay to zoom on (they are pinned to map), but popups are floating UI.
            return (
                target.tagName === 'CANVAS' ||
                target.classList.contains('maplibregl-canvas') ||
                target.closest('.maplibregl-canvas-container') !== null ||
                target.closest('.maplibregl-marker') !== null
            );
        };

        // Prevent pinch-to-zoom on non-map elements
        const handleTouchMove = (e: TouchEvent) => {
            // Only intercept multi-touch (pinch) gestures
            if (e.touches.length >= 2) {
                if (!isMapElement(e.target)) {
                    e.preventDefault();
                }
            }
        };

        // Prevent Ctrl+wheel zoom on non-map elements (desktop browser zoom)
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey && !isMapElement(e.target)) {
                e.preventDefault();
            }
        };

        // Prevent double-tap zoom by detecting rapid taps on non-map elements
        let lastTouchEnd = 0;
        const handleTouchEnd = (e: TouchEvent) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                // Double tap detected
                if (!isMapElement(e.target)) {
                    e.preventDefault();
                }
            }
            lastTouchEnd = now;
        };

        // Use passive: false to allow preventDefault
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('wheel', handleWheel);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);
}

export default usePreventUIZoom;

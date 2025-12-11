

// PRECISION PHYSICS SYSTEM
// Tuned for "Apple-style" fluid interfaces

export const springs = {
    // "Liquid Glass" - Organic, slow, heavy (for expansion/morphing out)
    // Used when UI elements grow or take over screen real estate
    liquid: {
        type: "spring" as const,
        stiffness: 180,
        damping: 28,
        mass: 1.2
    },

    // "Snappy Return" - Fast but smooth (for retraction/interactions)
    // Used when UI elements close, shrink, or bounce back. Prevents "stuck" feeling.
    snappy: {
        type: "spring" as const,
        stiffness: 207,  // 15% faster than original 180
        damping: 24,
        mass: 1
    },

    // "Soft" - For subtle movements like hover lifts
    soft: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
    },

    // "Bounce" - For playful notifications or attention grabbers
    bouncy: {
        type: "spring" as const,
        stiffness: 500,
        damping: 15
    }
};

export const transitions = {
    // Standard hover eases
    hover: { duration: 0.35, ease: "easeOut" as const },

    // Fast interaction (click/tap)
    tap: { duration: 0.1, ease: "linear" as const },

    // Morph logic: Liquid out (expanding), Snappy in (collapsing)
    morph: (isExpanding: boolean) => isExpanding ? springs.liquid : springs.snappy
};

export const variants = {
    // Universal Pop-Out Hover (Glassmorphism standard)
    // NOTE: boxShadow removed - let CSS control shadows to avoid override conflicts
    popOut: {
        initial: { scale: 1, y: 0 },
        hover: {
            scale: 1.005,
            y: -0.5,
            transition: transitions.hover
        },
        tap: {
            scale: 0.96,
            transition: transitions.tap
        }
    },

    // Subtle In-Menu Hover
    subtle: {
        initial: { scale: 1 },
        hover: {
            scale: 1.005,
            transition: transitions.hover
        },
        tap: {
            scale: 0.98,
            transition: transitions.tap
        }
    },

    // Fade Scale (for Modals/Dropdowns)
    fadeScale: {
        initial: { opacity: 0, scale: 0.95 },
        animate: {
            opacity: 1,
            scale: 1,
            transition: springs.snappy
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.15 }
        }
    }
};

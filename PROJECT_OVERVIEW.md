# Geography School Map - Project Overview

## Core Idea

A **premium, minimalist web-based interactive map application** designed specifically for geography teachers. The application provides professional-grade cartographic tools in a beautiful, distraction-free interface that works seamlessly across devices and automatically adapts to the user's system theme.

### Primary Use Case
Enable geography teachers to:
- **Teach with precision**: Draw on maps, place markers, and measure distances with geodesic accuracy
- **Visualize different perspectives**: Switch between Political, Physical, Satellite, and Topographic map layers
- **Navigate continents**: Quickly jump to different regions (Europe, Asia, Africa, Australia, Americas, Antarctica)
- **Work efficiently**: Minimalist UI that doesn't interfere with the teaching experience

## Technology Stack

### Core Framework
- **Vite + React + TypeScript**: Modern, fast development with type safety
- **MapLibre GL JS**: Open-source, vector-capable mapping engine (free alternative to Mapbox)
- **Lucide React**: Professional SVG icon library

### Specialized Libraries
- **@mapbox/mapbox-gl-draw**: Polygon and line drawing capabilities
- **@turf/turf**: Precise geodesic calculations for measurements
- **System Theme Detection**: Automatic dark/light mode based on OS preferences

### Styling Philosophy
- **Vanilla CSS with CSS Variables**: Maximum control and theming flexibility
- **Glassmorphism Design**: Backdrop blur effects for modern, premium feel
- **"Void" Aesthetic**: High-contrast minimalism (inspired by Design Award 2025 standards)

## Development Journey

### Phase 1: Foundation (Initial Setup)
✅ Vite project initialization with React + TypeScript  
✅ MapLibre GL JS integration with Europe-focused view  
✅ Basic navigation controls (zoom, pan, rotate)  
✅ Premium CSS theme system with dark mode

### Phase 2: UI/UX Design
✅ Floating dock navigation (bottom-center)  
✅ Glassmorphic panels and controls  
✅ Tool icons (Draw, Marker, Measure, Layers)  
✅ Removed generic Vite boilerplate for clean slate

### Phase 3: Core Functionality
✅ MapboxDraw integration for polygon/line drawing  
✅ Point marker placement  
✅ Real-time distance and area measurements (km/km²)  
✅ Live measurement display in UI

### Phase 4: Map Content Expansion
✅ **Political Map**: Administrative boundaries (Carto Positron)  
✅ **Physical Map**: Terrain features (Esri World Physical)  
✅ **Satellite Map**: Aerial imagery (Esri World Imagery)  
✅ **Topographic Map**: Contour lines and elevation (OpenTopoMap)  
✅ Continent navigation system (7 continents with precise coordinates)

### Phase 5: Refinement (Based on User Feedback)
✅ Replaced emojis with professional Lucide React icons  
✅ Added `user-select: none` to prevent text selection  
✅ Language switcher (English, Bulgarian, Italian)  
✅ "Developed by Eptesicus Labs" attribution in info button  
✅ System theme auto-detection and switching

### Phase 6: Critical UX Fixes
✅ **Cursor Behavior**: Crosshair for draw/measure, pointer for marker  
✅ **Map Dragging**: Disabled during drawing to prevent accidental panning  
✅ **Glassmorphism on Controls**: Applied blur effects to map navigation buttons  
✅ **Icon-Only Language Switcher**: Minimized to single globe icon  
✅ **Info Button**: Expandable attribution panel in bottom-left  
✅ **Panel Exclusivity**: Only one panel (layers/language/info) open at a time  
✅ **Enhanced Blur**: Increased backdrop-filter from 12px to 16px for stronger effect

## Key Features

### Map Tools
- **Draw (✎)**: Polygon drawing mode with cursor feedback
- **Marker (📍)**: Point placement on map
- **Measure (📏)**: Line drawing with real-time km calculations
- **Layers (❏)**: Quick access to map style switcher

### Map Styles (All Free Resources)
1. **Political**: Clean, light-themed administrative map
2. **Physical**: Terrain-focused geography
3. **Satellite**: High-resolution aerial imagery
4. **Topographic**: Detailed contours and elevation

### User Experience
- **System Theme Sync**: Automatically matches OS dark/light mode
- **Panel Management**: Smart panel closing (only one open at a time)
- **Glassmorphism**: 16px backdrop blur for premium visual depth
- **Responsive Controls**: All UI elements adapt to interaction state

## Architecture Highlights

### Component Structure
```
src/
├── components/
│   ├── Map/
│   │   ├── MapContainer.tsx (Core map + drawing tools)
│   │   ├── MapContainer.css (Cursor styles + control glassmorphism)
│   │   └── mapStyles.ts (Layer definitions + continent coords)
│   └── UI/
│       ├── Overlay.tsx (Main UI orchestration)
│       ├── LanguageSwitcher.tsx (Icon-only language selector)
│       └── Attribution.tsx (Expandable info button)
├── hooks/
│   └── useTheme.ts (System theme detection)
└── styles/
    └── theme.css (Global CSS variables for dark/light modes)
```

### State Management
- **Tool State**: Managed in `Overlay.tsx` and passed to `MapContainer`
- **Panel Exclusivity**: Coordinated via toggle handlers in `Overlay`
- **Theme**: Automatic via `useTheme` hook (listens to `prefers-color-scheme`)

## Build Status
✅ **Production Build**: Successful  
✅ **TypeScript**: Zero errors  
✅ **Bundle Size**: ~1.29 MB (includes MapLibre + drawing libraries)

## Next Steps (Potential Enhancements)
- Add translation strings for UI labels (currently only language switcher dropdown is translated)
- Implement continent navigation UI (architecture exists, needs UI buttons)
- Add custom map styles (currently uses free public tile servers)
- Performance optimization with code-splitting for large libraries
- Add keyboard shortcuts for power users
- Implement drawing shape editing (move, resize, delete)

---

**Built with precision for geography education.**

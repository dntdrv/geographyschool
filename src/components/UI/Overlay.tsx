import React, { useState, useRef } from 'react';
import { Menu, MapPin, Ruler, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Overlay.css';
import LayerMenu from './LayerMenu';
import SearchControl from './SearchControl';
import ZoomControl from './ZoomControl';
import type { Language } from './LanguageSwitcher';
import type { MapStyleId } from '../Map/mapStyles';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';

interface OverlayProps {
    onToolChange: (tool: string | null) => void;
    onLayerChange: (layer: MapStyleId) => void;
    measurement: string;
    onClearMeasurement: () => void;
    currentLang: Language;
    onLangChange: (lang: Language) => void;
    translations: any;
    currentLayer: MapStyleId;
    showGraticules: boolean;
    onToggleGraticules: () => void;
    showLabels: boolean;
    onToggleLabels: () => void;
    showBorders: boolean;
    onToggleBorders: () => void;
    showTemperature: boolean;
    onToggleTemperature: () => void;
    activeTool: string | null;
    coordinates: { lat: number; lng: number; zoom: number } | null;
    onLocationSelect: (location: any) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onLocateMe: () => void;
    isMapDark?: boolean;
}

const spring: any = {
    type: "spring",
    stiffness: 300,
    damping: 20
};

const Overlay: React.FC<OverlayProps> = ({
    onToolChange,
    onLayerChange,
    measurement,
    onClearMeasurement,
    currentLang,
    onLangChange,
    translations,
    currentLayer,
    showGraticules,
    onToggleGraticules,
    showLabels,
    onToggleLabels,
    showBorders,
    onToggleBorders,
    showTemperature,
    onToggleTemperature,
    activeTool,
    coordinates,
    onLocationSelect,
    onZoomIn,
    onZoomOut,
    onLocateMe
}) => {
    const [showLayers, setShowLayers] = useState(false);
    const [showLang, setShowLang] = useState(false);

    const langMenuRef = useRef<HTMLDivElement>(null);
    const layerMenuRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(langMenuRef as React.RefObject<HTMLElement>, () => setShowLang(false));
    useOnClickOutside(layerMenuRef as React.RefObject<HTMLElement>, () => setShowLayers(false));

    const toggleLayers = () => {
        setShowLayers(!showLayers);
        if (!showLayers) onToolChange(null);
    };

    // Calculate Scale
    const getScaleWidth = (lat: number, zoom: number) => {
        // Meters per pixel at equator = 78271.517 (for 512px tiles)
        // Meters per pixel at lat = 78271.517 * cos(lat * PI / 180) / 2^zoom
        const metersPerPixel = 78271.517 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);

        // Target width in pixels (approximate)
        const targetWidthPx = 100;
        const targetMeters = targetWidthPx * metersPerPixel;

        // Round to nice number
        let roundedMeters = 0;
        if (targetMeters > 1000000) roundedMeters = Math.round(targetMeters / 1000000) * 1000000;
        else if (targetMeters > 100000) roundedMeters = Math.round(targetMeters / 100000) * 100000;
        else if (targetMeters > 10000) roundedMeters = Math.round(targetMeters / 10000) * 10000;
        else if (targetMeters > 1000) roundedMeters = Math.round(targetMeters / 1000) * 1000;
        else if (targetMeters > 100) roundedMeters = Math.round(targetMeters / 100) * 100;
        else roundedMeters = Math.round(targetMeters / 10) * 10;

        const finalWidthPx = roundedMeters / metersPerPixel;
        const label = roundedMeters >= 1000 ? `${roundedMeters / 1000} km` : `${roundedMeters} m`;

        return { width: finalWidthPx, label };
    };

    const scaleInfo = coordinates ? getScaleWidth(coordinates.lat, coordinates.zoom) : null;

    return (
        <div className="overlay-container">

            {/* Top Center Group: Search & Language */}
            <div className="top-center-group">
                {/* Search Bar (Left) */}
                <div className="search-container-wrapper">
                    <SearchControl
                        placeholder={translations.ui.searchPlaceholder}
                        onResult={(loc) => {
                            onLocationSelect(loc);
                        }}
                    />
                </div>

                {/* Language Switcher (Right, Icon Only) */}
                <div className="lang-container-wrapper" ref={langMenuRef}>
                    <motion.button
                        className="glass-panel icon-btn rounded-full"
                        onClick={() => setShowLang(!showLang)}
                        title="Language"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        transition={spring}
                    >
                        <Globe size={20} />
                    </motion.button>

                    <AnimatePresence>
                        {showLang && (
                            <motion.div
                                className="lang-options glass-panel"
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                transition={spring}
                            >
                                <button onClick={() => { onLangChange('en'); setShowLang(false); }} className={currentLang === 'en' ? 'active' : ''}>English</button>
                                <button onClick={() => { onLangChange('bg'); setShowLang(false); }} className={currentLang === 'bg' ? 'active' : ''}>Български</button>
                                <button onClick={() => { onLangChange('it'); setShowLang(false); }} className={currentLang === 'it' ? 'active' : ''}>Italiano</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Left Stack: Coordinates */}
            <div className="bottom-left-stack">
                {/* Coordinates & Scale */}
                {coordinates && (
                    <motion.div
                        className="coordinates-pill glass-panel"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                    >
                        <div className="coords-text">
                            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                        </div>
                        {scaleInfo && (
                            <div className="scale-container">
                                <div className="scale-bar" style={{ width: `${scaleInfo.width}px` }}></div>
                                <div className="scale-label">{scaleInfo.label}</div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Bottom Right Stack: Zoom & Locate Controls */}
            <div className="bottom-right-stack">
                <div className="zoom-locate-group">
                    <ZoomControl onZoomIn={onZoomIn} onZoomOut={onZoomOut} onLocateMe={onLocateMe} />
                </div>
            </div>

            {/* Measurement Display (Floating Pill) */}
            <AnimatePresence>
                {measurement && (
                    <motion.div
                        className="measurement-pill glass-panel"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={spring}
                    >
                        <span className="measure-text">{measurement}</span>
                        <button className="clear-btn-absolute" onClick={onClearMeasurement}>
                            <X size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Center: The Dock */}
            <div className="dock-wrapper">
                {/* Layer Panel (Pop-up above Dock) */}
                <AnimatePresence>
                    {showLayers && (
                        <div ref={layerMenuRef}>
                            <motion.div
                                className="layer-panel-popup glass-panel"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={spring}
                            >
                                <div className="panel-header">
                                    <span>{translations.ui.mapLayers}</span>
                                    <button className="close-panel-btn" onClick={() => setShowLayers(false)}>
                                        <X size={16} />
                                    </button>
                                </div>
                                <LayerMenu
                                    activeLayer={currentLayer}
                                    onLayerChange={onLayerChange}
                                    showGraticules={showGraticules}
                                    onToggleGraticules={onToggleGraticules}
                                    showLabels={showLabels}
                                    onToggleLabels={onToggleLabels}
                                    showBorders={showBorders}
                                    onToggleBorders={onToggleBorders}
                                    showTemperature={showTemperature}
                                    onToggleTemperature={onToggleTemperature}
                                    translations={translations}
                                    isDark={false}
                                />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* The Glass Dock (Compact) */}
                <motion.div
                    className="glass-dock glass-panel"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={spring}
                >
                    {/* Left Section: Marker */}
                    <button
                        className={`dock-btn ${activeTool === 'marker' ? 'active' : ''}`}
                        onClick={() => onToolChange(activeTool === 'marker' ? null : 'marker')}
                        title={translations.tools.marker}
                    >
                        <MapPin size={20} />
                    </button>

                    <div className="dock-divider"></div>

                    {/* Center Section: Layers Trigger (Hamburger) */}
                    <button
                        className={`dock-btn center-btn ${showLayers ? 'active' : ''}`}
                        onClick={toggleLayers}
                        title={translations.tools.layers}
                    >
                        <Menu size={20} />
                    </button>

                    <div className="dock-divider"></div>

                    {/* Right Section: Ruler */}
                    <button
                        className={`dock-btn ${activeTool === 'measure-distance' ? 'active' : ''}`}
                        onClick={() => onToolChange(activeTool === 'measure-distance' ? null : 'measure-distance')}
                        title={translations.tools.measure}
                    >
                        <Ruler size={20} />
                    </button>
                </motion.div>
            </div>

        </div>
    );
};

export default Overlay;

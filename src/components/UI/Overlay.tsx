import React, { useState } from 'react';
import { Layers, MapPin, Ruler, X } from 'lucide-react';
import './Overlay.css';
import LanguageSwitcher from './LanguageSwitcher';
import LayerMenu from './LayerMenu';
import type { Language } from './LanguageSwitcher';
import type { MapStyleId } from '../Map/mapStyles';
import SearchControl from './SearchControl';

interface OverlayProps {
    onToolChange: (tool: string | null) => void;
    onLayerChange: (layer: MapStyleId) => void;
    measurement: string | null;
    currentLang: Language;
    onLangChange: (lang: Language) => void;
    translations: any;
    currentLayer: MapStyleId;
    showGraticules: boolean;
    onToggleGraticules: () => void;
    showLabels: boolean;
    onToggleLabels: () => void;
    showWeather: boolean;
    onToggleWeather: () => void;
    showClouds: boolean;
    onToggleClouds: () => void;
    activeTool: string | null;
    isMapDark: boolean;
    coordinates: { lat: number; lng: number } | null;
    onLocationSelect: (location: { center: [number, number]; zoom?: number; bbox?: [number, number, number, number] }) => void;
}

interface Tool {
    id: string;
    icon: React.ReactNode;
    label: string;
}

const Overlay: React.FC<OverlayProps> = ({
    onToolChange,
    onLayerChange,
    measurement,
    currentLang,
    onLangChange,
    translations,
    currentLayer,
    showGraticules,
    onToggleGraticules,
    showLabels,
    onToggleLabels,
    showWeather,
    onToggleWeather,
    showClouds,
    onToggleClouds,
    activeTool,
    isMapDark,
    coordinates,
    onLocationSelect
}) => {
    const [showLayers, setShowLayers] = useState(false);

    if (!translations || !translations.tools) {
        return null;
    }

    const tools: Tool[] = [
        { id: 'marker', icon: <MapPin size={24} />, label: translations.tools?.marker || 'Marker' },
        { id: 'measure-distance', icon: <Ruler size={24} />, label: translations.tools?.measure || 'Measure' },
        { id: 'layers', icon: <Layers size={24} />, label: translations.tools?.layers || 'Layers' },
    ];

    const handleToolClick = (id: string) => {
        if (id === 'layers') {
            setShowLayers(!showLayers);
            return;
        }

        // Close layers if opening a tool (optional, but cleaner)
        if (showLayers) setShowLayers(false);

        // Immediate toggle for Measure Distance and Marker
        if (activeTool === id) {
            onToolChange(null);
        } else {
            onToolChange(id);
        }
    };

    return (
        <div className={`overlay-container ${isMapDark ? 'dark-mode' : 'light-mode'}`}>
            {/* Top Right: Language Switcher & Search */}
            <div className="top-right-controls">
                <SearchControl
                    isDark={isMapDark}
                    placeholder={translations.ui?.searchPlaceholder || "Search..."}
                    onResult={onLocationSelect}
                />
                <LanguageSwitcher
                    currentLang={currentLang}
                    onLangChange={onLangChange}
                    onToggle={(isOpen) => {
                        if (isOpen) setShowLayers(false);
                    }}
                    translations={translations}
                />
            </div>

            {/* Bottom Left: Coordinates */}
            {coordinates && (
                <div className="coordinates-display">
                    {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                </div>
            )}

            {/* Measurement Display (Top Center or near tool) */}
            {measurement && (
                <div className="measurement-display">
                    {measurement}
                </div>
            )}

            {/* Simple Toolbar (Bottom Center or Right) */}
            <div className="simple-toolbar">
                {tools.map((tool) => {
                    const isActive = activeTool === tool.id || (tool.id === 'layers' && showLayers);
                    return (
                        <button
                            key={tool.id}
                            className={`toolbar-btn ${isActive ? 'active' : ''}`}
                            onClick={() => handleToolClick(tool.id)}
                            title={tool.label}
                        >
                            {tool.icon}
                        </button>
                    );
                })}
            </div>

            {/* Layer Menu (Popup) */}
            {showLayers && (
                <div className="layer-menu-popup">
                    <div className="popup-header">
                        <span>{translations.tools?.layers}</span>
                        <button className="close-btn" onClick={() => setShowLayers(false)}>
                            <X size={18} />
                        </button>
                    </div>
                    <LayerMenu
                        activeLayer={currentLayer}
                        onLayerChange={(layer) => {
                            onLayerChange(layer);
                            // Optional: Close on select? User might want to toggle multiple things.
                            // Let's keep it open.
                        }}
                        showGraticules={showGraticules}
                        onToggleGraticules={onToggleGraticules}
                        showLabels={showLabels}
                        onToggleLabels={onToggleLabels}
                        showWeather={showWeather}
                        onToggleWeather={onToggleWeather}
                        showClouds={showClouds}
                        onToggleClouds={onToggleClouds}
                        translations={translations}
                        isDark={isMapDark}
                    />
                </div>
            )}
        </div>
    );
};

export default Overlay;

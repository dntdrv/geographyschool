import React from 'react';
import './LayerMenu.css';
import type { MapStyleId } from '../Map/mapStyles';

interface LayerMenuProps {
    activeLayer: MapStyleId;
    onLayerChange: (layer: MapStyleId) => void;
    showGraticules: boolean;
    onToggleGraticules: () => void;
    showLabels: boolean;
    onToggleLabels: () => void;
    showWeather: boolean;
    onToggleWeather: () => void;
    showClouds: boolean;
    onToggleClouds: () => void;
    translations: any;
    isDark: boolean;
}

const LayerMenu: React.FC<LayerMenuProps> = ({
    activeLayer,
    onLayerChange,
    showGraticules,
    onToggleGraticules,
    showLabels,
    onToggleLabels,
    showWeather,
    onToggleWeather,
    showClouds,
    onToggleClouds,
    translations,
    isDark
}) => {
    if (!translations || !translations.layers) {
        return null;
    }

    const baseLayers: { id: MapStyleId; label: string }[] = [
        { id: 'political', label: translations.layers?.political || 'Political' },
        { id: 'relief', label: translations.layers?.relief || 'Relief' },
        { id: 'satellite', label: translations.layers?.satellite || 'Satellite' },
        { id: 'topo', label: translations.layers?.topo || 'Topographic' },
    ];

    return (
        <div className={`layer-menu-container ${isDark ? 'dark-mode' : 'light-mode'}`}>
            {/* Section A: Base Layers */}
            <div className="layer-section-header">{translations.ui.mapLayers}</div>
            <div className="layer-list">
                {baseLayers.map((layer) => (
                    <div
                        key={layer.id}
                        className={`layer-item ${activeLayer === layer.id ? 'active' : ''}`}
                        onClick={() => onLayerChange(layer.id)}
                    >
                        {activeLayer === layer.id && <span className="active-dot">•</span>}
                        <span className="layer-label">{layer.label}</span>
                    </div>
                ))}
            </div>

            <div className="layer-divider"></div>

            {/* Section B: Overlays */}
            <div className="layer-section-header">{translations.ui.overlays}</div>
            <div className="overlay-list">
                {/* Graticules */}
                <div className="overlay-item">
                    <span className="overlay-label">{translations.overlays.graticules}</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={showGraticules}
                            onChange={onToggleGraticules}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>

                {/* Show Labels */}
                <div className="overlay-item">
                    <span className="overlay-label">{translations.overlays.labels}</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={showLabels}
                            onChange={onToggleLabels}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>

                {/* Weather (Precipitation) */}
                <div className="overlay-item">
                    <span className="overlay-label">Weather (Rain)</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={showWeather}
                            onChange={onToggleWeather}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>

                {/* Weather (Clouds) */}
                <div className="overlay-item">
                    <span className="overlay-label">Weather (Clouds)</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={showClouds}
                            onChange={onToggleClouds}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default LayerMenu;

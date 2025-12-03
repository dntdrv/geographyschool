import React from 'react';
import './Legend.css';

interface LegendProps {
    showWeather: boolean;
    showTemperature: boolean;
    activeLayer: string;
    weatherTs?: string;
    translations: any;
}

const Legend: React.FC<LegendProps> = ({ showWeather, showTemperature, activeLayer, weatherTs, translations }) => {

    // Don't show if no relevant layers are active
    if (!showWeather && !showTemperature && activeLayer !== 'relief' && activeLayer !== 'topo') {
        return null;
    }

    return (
        <div className="map-legend">
            {/* Rain Legend (RainViewer Universal Blue) */}
            {showWeather && (
                <div className="legend-section">
                    <div className="legend-title">
                        {translations.legend.precipitation}
                        {weatherTs && <span className="legend-ts"> ({weatherTs})</span>}
                    </div>
                    <div className="legend-gradient rain-gradient"></div>
                    <div className="legend-labels">
                        <span>{translations.legend.light}</span>
                        <span>{translations.legend.moderate}</span>
                        <span>{translations.legend.heavy}</span>
                    </div>
                </div>
            )}

            {/* Temperature Legend (VIIRS/MODIS LST) */}
            {showTemperature && (
                <div className="legend-section">
                    <div className="legend-title">{translations.legend.temp}</div>
                    <div className="legend-gradient temp-gradient"></div>
                    <div className="legend-labels">
                        <span>-25°</span>
                        <span>0°</span>
                        <span>25°</span>
                        <span>50°+</span>
                    </div>
                </div>
            )}

            {/* Elevation Legend (For Relief/Topo) */}
            {(activeLayer === 'relief' || activeLayer === 'topo') && (
                <div className="legend-section">
                    <div className="legend-title">{translations.legend.elevation}</div>
                    <div className="legend-gradient elevation-gradient"></div>
                    <div className="legend-labels">
                        <span>0</span>
                        <span>500</span>
                        <span>2000</span>
                        <span>4000+</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Legend;

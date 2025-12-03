import React from 'react';
import { motion } from 'framer-motion';
import './LayerMenu.css';
import type { MapStyleId } from '../Map/mapStyles';
import { MAP_STYLES } from '../Map/mapStyles';

interface LayerMenuProps {
    activeLayer: MapStyleId;
    onLayerChange: (layer: MapStyleId) => void;
    showGraticules: boolean;
    onToggleGraticules: () => void;
    showLabels: boolean;
    onToggleLabels: () => void;
    showBorders: boolean;
    onToggleBorders: () => void;
    showTemperature: boolean;
    onToggleTemperature: () => void;
    translations: any;
    isDark: boolean;
}

const spring: any = {
    type: "spring",
    stiffness: 180,
    damping: 12,
    mass: 1
};

const LayerMenu: React.FC<LayerMenuProps> = ({
    activeLayer,
    onLayerChange,
    showGraticules,
    onToggleGraticules,
    showLabels,
    onToggleLabels,
    showBorders,
    onToggleBorders,
    showTemperature,
    onToggleTemperature,
    translations,
    // isDark is intentionally ignored for UI styling as per "Glass Panels NEVER CHANGE COLOR" rule
}) => {

    return (
        <div className="layer-menu-container">
            {/* Zone A: Map Mode Selector (Segmented Control) */}
            <div className="zone-a-selector">
                <div className="segmented-control">
                    {Object.entries(MAP_STYLES).map(([id]) => (
                        <div
                            key={id}
                            className={`segment-item ${activeLayer === id ? 'active' : ''}`}
                            onClick={() => onLayerChange(id as MapStyleId)}
                        >
                            {activeLayer === id && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="active-pill-bg"
                                    transition={spring}
                                />
                            )}
                            <span className="segment-label">{translations.layers[id]}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-divider"></div>

            {/* Zone B: Data Layers (Toggles) */}
            <div className="zone-b-layers">
                <ToggleItem
                    label={translations.overlays.graticules}
                    isOn={showGraticules}
                    onToggle={onToggleGraticules}
                />
                <ToggleItem
                    label={translations.overlays.labels}
                    isOn={showLabels}
                    onToggle={onToggleLabels}
                />
                <ToggleItem
                    label={translations.overlays.borders}
                    isOn={showBorders}
                    onToggle={onToggleBorders}
                />
                <ToggleItem
                    label={translations.overlays.temperature}
                    isOn={showTemperature}
                    onToggle={onToggleTemperature}
                />
            </div>
        </div>
    );
};

// Reusable Spring-Loaded Toggle Component
const ToggleItem = ({ label, isOn, onToggle }: { label: string, isOn: boolean, onToggle: () => void }) => {
    return (
        <motion.div
            className="toggle-row"
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.4)" }}
            transition={spring}
            onClick={onToggle}
        >
            <span className="toggle-label">{label}</span>
            <div className={`toggle-switch-container ${isOn ? 'on' : 'off'}`}>
                <motion.div
                    className="toggle-handle"
                    layout
                    transition={spring}
                />
            </div>
        </motion.div>
    );
};

export default LayerMenu;

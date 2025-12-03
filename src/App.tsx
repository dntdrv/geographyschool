import { useRef, useState } from 'react';
import MapContainer from './components/Map/MapContainer';
import type { MapRef } from './components/Map/MapContainer';
import Overlay from './components/UI/Overlay';
import type { MapStyleId } from './components/Map/mapStyles';
import { translations } from './utils/translations';
import type { Language } from './components/UI/LanguageSwitcher';
import './styles/glassmorphism.css';
import './App.css';

import { MAP_STYLES } from './components/Map/mapStyles';

function App() {
  const mapRef = useRef<MapRef>(null);
  const [measurement, setMeasurement] = useState('');
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [currentLayer, setCurrentLayer] = useState<MapStyleId>('political');
  const [showGraticules, setShowGraticules] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showBorders, setShowBorders] = useState(false);
  const [showTemperature, setShowTemperature] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const activeToolRef = useRef<string | null>(null);
  const onToolChangeRef = useRef<(tool: string | null) => void>(() => { });

  // Sync ref with handler
  onToolChangeRef.current = (tool) => {
    setActiveTool(tool);
    activeToolRef.current = tool;
  };

  const handleToolChange = (tool: string | null) => {
    setActiveTool(tool);
    activeToolRef.current = tool;
    mapRef.current?.setTool(tool || 'none');
  };

  const handleClearMeasurement = () => {
    setMeasurement('');
    mapRef.current?.clearMeasurement();
  };

  const handleLayerChange = (layer: MapStyleId) => {
    setCurrentLayer(layer);
    setIsDark(MAP_STYLES[layer].isDark);
  };

  const handleZoomIn = () => {
    mapRef.current?.getMap()?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.getMap()?.zoomOut();
  };

  return (
    <div className="App">
      <MapContainer
        ref={mapRef}
        onMeasure={setMeasurement}
        activeLayer={currentLayer}
        showGraticules={showGraticules}
        showLabels={showLabels}
        showBorders={showBorders}
        showTemperature={showTemperature}
        currentLang={currentLang}
        onCoordinatesChange={setCoordinates}
        activeToolRef={activeToolRef}
        onToolChangeRef={onToolChangeRef}
      />
      <Overlay
        onToolChange={handleToolChange}
        onLayerChange={handleLayerChange}
        measurement={measurement}
        onClearMeasurement={handleClearMeasurement}
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        translations={translations[currentLang]}
        currentLayer={currentLayer}
        showGraticules={showGraticules}
        onToggleGraticules={() => setShowGraticules(!showGraticules)}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
        showBorders={showBorders}
        onToggleBorders={() => setShowBorders(!showBorders)}
        showTemperature={showTemperature}
        onToggleTemperature={() => setShowTemperature(!showTemperature)}
        activeTool={activeTool}
        isMapDark={isDark}
        coordinates={coordinates}
        onLocationSelect={(location) => mapRef.current?.flyToLocation(location.center, location.zoom, location.bbox)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocateMe={() => mapRef.current?.locateMe()}
      />
    </div>
  );
}

export default App;

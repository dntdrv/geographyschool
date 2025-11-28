import { useRef, useState } from 'react';
import MapContainer from './components/Map/MapContainer';
import type { MapRef } from './components/Map/MapContainer';
import Overlay from './components/UI/Overlay';
import type { MapStyleId } from './components/Map/mapStyles';
import { translations } from './utils/translations';
import type { Language } from './components/UI/LanguageSwitcher';
import './App.css';

import { MAP_STYLES } from './components/Map/mapStyles';

function App() {
  const mapRef = useRef<MapRef>(null);
  const [measurement, setMeasurement] = useState('');
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [currentLayer, setCurrentLayer] = useState<MapStyleId>('political');
  const [showGraticules, setShowGraticules] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [showClouds, setShowClouds] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const handleToolChange = (tool: string | null) => {
    setActiveTool(tool);
    mapRef.current?.setTool(tool || 'none');
  };

  const handleLayerChange = (layer: MapStyleId) => {
    setCurrentLayer(layer);
    setIsDark(MAP_STYLES[layer].isDark);
  };

  return (
    <div className="App">
      <MapContainer
        ref={mapRef}
        onMeasure={setMeasurement}
        activeLayer={currentLayer}
        showGraticules={showGraticules}
        showLabels={showLabels}
        showWeather={showWeather}
        showClouds={showClouds}
        currentLang={currentLang}
        onCoordinatesChange={setCoordinates}
      />
      <Overlay
        onToolChange={handleToolChange}
        onLayerChange={handleLayerChange}
        measurement={measurement}
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        translations={translations[currentLang]}
        currentLayer={currentLayer}
        showGraticules={showGraticules}
        onToggleGraticules={() => setShowGraticules(!showGraticules)}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
        showWeather={showWeather}
        onToggleWeather={() => setShowWeather(!showWeather)}
        showClouds={showClouds}
        onToggleClouds={() => setShowClouds(!showClouds)}
        activeTool={activeTool}
        isMapDark={isDark}
        coordinates={coordinates}
        onLocationSelect={(location) => mapRef.current?.flyToLocation(location.center, location.zoom, location.bbox)}
      />
    </div>
  );
}

export default App;

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import './MapContainer.css';
import { MAP_STYLES } from './mapStyles';
import type { MapStyleId } from './mapStyles';

// Define Language type locally since it's not exported from translations
export type Language = 'en' | 'it' | 'bg';

export interface MapRef {
    setTool: (tool: string) => void;
    setLayer: (layer: MapStyleId) => void;
    flyToLocation: (center: [number, number], zoom?: number, bbox?: [number, number, number, number]) => void;
}

interface MapContainerProps {
    onMeasure: (value: string) => void;
    activeLayer: MapStyleId;
    showGraticules: boolean;
    showLabels: boolean;
    showWeather: boolean;
    showClouds: boolean;
    currentLang: Language;
    onCoordinatesChange: (coords: { lat: number; lng: number } | null) => void;
}

const MapContainer = forwardRef<MapRef, MapContainerProps>(({
    onMeasure,
    activeLayer,
    showGraticules,
    showLabels,
    showWeather,
    showClouds,
    currentLang,
    onCoordinatesChange
}, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const draw = useRef<MapboxDraw | null>(null);
    const markers = useRef<maplibregl.Marker[]>([]);

    const [activeTool, setActiveTool] = useState<string | null>(null);
    const activeToolRef = useRef<string | null>(null);

    // Diagnostic State
    const [debugInfo, setDebugInfo] = useState<{
        zoom: string;
        layers: string[];
        weatherTs: string;
    }>({ zoom: '-', layers: [], weatherTs: '-' });

    // Custom Ruler State
    const rulerState = useRef<{
        active: boolean;
        points: [number, number][];
        tempPoint: [number, number] | null;
    }>({ active: false, points: [], tempPoint: null });

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        setTool: (tool: string) => {
            if (!map.current) return;

            // Deactivate previous tool
            if (activeToolRef.current === 'measure-distance') {
                rulerState.current = { active: false, points: [], tempPoint: null };
                updateRulerLayer();
                onMeasure('');
                map.current.getCanvas().style.cursor = '';
            }

            // Activate new tool
            if (tool === 'measure-distance') {
                if (activeToolRef.current === 'measure-distance') {
                    // Toggle off
                    setActiveTool(null);
                    activeToolRef.current = null;
                } else {
                    // Toggle on
                    setActiveTool('measure-distance');
                    activeToolRef.current = 'measure-distance';
                    rulerState.current = { active: true, points: [], tempPoint: null };
                    map.current.getCanvas().style.cursor = 'crosshair';
                }
                return;
            }

            setActiveTool(tool);
            activeToolRef.current = tool;
            map.current.getCanvas().style.cursor = tool === 'marker' ? 'pointer' : '';

            if (tool === 'none') {
                setActiveTool(null);
                activeToolRef.current = null;
            }
        },
        setLayer: (_layer: MapStyleId) => {
            console.warn('setLayer is deprecated. Use activeLayer prop instead.');
        },
        flyToLocation: (center: [number, number], zoom?: number, bbox?: [number, number, number, number]) => {
            if (!map.current) return;

            if (bbox) {
                map.current.fitBounds(bbox as [number, number, number, number], {
                    padding: 50,
                    maxZoom: 15
                });
            } else {
                map.current.flyTo({
                    center,
                    zoom: zoom || 10,
                    essential: true
                });
            }
        }
    }));

    // Helper to update Custom Ruler Layer
    const updateRulerLayer = () => {
        if (!map.current) return;

        const sourceId = 'ruler-source';
        const source = map.current.getSource(sourceId) as maplibregl.GeoJSONSource;

        if (!source) return;

        const features: any[] = [];
        const points = rulerState.current.points;
        const temp = rulerState.current.tempPoint;

        // 1. Points
        points.forEach(p => {
            features.push(turf.point(p));
        });

        // 2. Line
        if (points.length > 0) {
            const lineCoords = [...points];
            if (temp) lineCoords.push(temp);

            if (lineCoords.length >= 2) {
                features.push(turf.lineString(lineCoords));
            }
        }

        source.setData({
            type: 'FeatureCollection',
            features: features
        });
    };

    // Initialize Map
    useEffect(() => {
        if (map.current) return;

        if (mapContainer.current) {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: {
                    version: 8,
                    sources: {
                        'terrain-source': {
                            type: 'raster-dem',
                            url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
                            tileSize: 256
                        }
                    },
                    layers: [],
                    // Use OpenFreeMap glyphs which are guaranteed to work with their tiles
                    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf"
                },
                center: [10, 50], // Default to Europe
                zoom: 4,
                attributionControl: false,
                pitch: 0,
                dragRotate: false, // DISABLE ROTATION
                touchZoomRotate: false, // DISABLE ROTATION
                localIdeographFontFamily: "'Inter', sans-serif",
                maxTileCacheSize: 100
            });

            // Add Controls
            map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
            map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
            map.current.addControl(new maplibregl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true
            }), 'bottom-right');

            // Initialize Draw (Only for other potential tools, NOT ruler)
            draw.current = new MapboxDraw({
                displayControlsDefault: false,
                controls: { line_string: false, trash: false },
                defaultMode: 'simple_select'
            });

            map.current.on('load', () => {
                // Add Ruler Source & Layers
                map.current?.addSource('ruler-source', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                });

                map.current?.addLayer({
                    id: 'ruler-line',
                    type: 'line',
                    source: 'ruler-source',
                    paint: {
                        'line-color': '#3b82f6',
                        'line-width': 3,
                        'line-dasharray': [2, 1]
                    },
                    filter: ['==', '$type', 'LineString']
                });

                map.current?.addLayer({
                    id: 'ruler-points',
                    type: 'circle',
                    source: 'ruler-source',
                    paint: {
                        'circle-radius': 5,
                        'circle-color': '#3b82f6',
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff'
                    },
                    filter: ['==', '$type', 'Point']
                });
            });

            // Click Handler
            map.current.on('click', (e) => {
                if (!map.current) return;

                // Custom Ruler Logic - Use activeToolRef to avoid stale closure
                if (activeToolRef.current === 'measure-distance' && rulerState.current.active) {
                    const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];

                    if (rulerState.current.points.length === 0) {
                        // Start Point
                        rulerState.current.points = [coords];
                        updateRulerLayer();
                    } else if (rulerState.current.points.length === 1) {
                        // End Point
                        rulerState.current.points.push(coords);
                        rulerState.current.tempPoint = null; // Clear temp
                        rulerState.current.active = false; // Stop drawing

                        updateRulerLayer();

                        // Calculate final distance
                        const line = turf.lineString(rulerState.current.points);
                        const length = turf.length(line, { units: 'kilometers' });
                        onMeasure(`${length.toLocaleString(undefined, { maximumFractionDigits: 2 })} km`);

                        // Reset cursor
                        map.current.getCanvas().style.cursor = '';
                        setActiveTool(null); // Deactivate tool in UI
                        activeToolRef.current = null;
                    }
                    return;
                }

                // Marker Tool
                if (map.current.getCanvas().style.cursor === 'pointer') {
                    const marker = new maplibregl.Marker({ color: '#ef4444' })
                        .setLngLat(e.lngLat)
                        .addTo(map.current);

                    const popupContent = document.createElement('div');
                    popupContent.innerHTML = `
                        <div style="color: #333; padding: 5px; min-width: 150px;">
                            <strong>Location</strong><br/>
                            Lat: ${e.lngLat.lat.toFixed(4)}<br/>
                            Lng: ${e.lngLat.lng.toFixed(4)}<br/>
                            <a href="https://www.google.com/maps?q=${e.lngLat.lat},${e.lngLat.lng}" target="_blank" style="
                                display: block;
                                margin-top: 8px;
                                color: #3b82f6;
                                text-decoration: none;
                                font-size: 13px;
                            ">Open in Google Maps &rarr;</a>
                            <button id="remove-marker-btn" style="
                                margin-top: 8px;
                                background: #ef4444;
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                                width: 100%;
                            ">Remove</button>
                        </div>
                    `;

                    const removeBtn = popupContent.querySelector('#remove-marker-btn');
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            marker.remove();
                            markers.current = markers.current.filter(m => m !== marker);
                        });
                    }

                    const popup = new maplibregl.Popup({ offset: 25 })
                        .setDOMContent(popupContent);

                    marker.setPopup(popup);
                    marker.togglePopup(); // Open immediately

                    markers.current.push(marker);
                }
            });

            // Mouse Move (Ruler & Coords)
            map.current.on('mousemove', (e) => {
                onCoordinatesChange({ lat: e.lngLat.lat, lng: e.lngLat.lng });

                // Update Debug Info
                if (map.current) {
                    const layers = map.current.getStyle().layers?.map(l => l.id) || [];
                    setDebugInfo(prev => ({
                        ...prev,
                        zoom: map.current!.getZoom().toFixed(2),
                        layers: layers
                    }));
                }

                // Use activeToolRef
                if (activeToolRef.current === 'measure-distance' && rulerState.current.active && rulerState.current.points.length === 1) {
                    rulerState.current.tempPoint = [e.lngLat.lng, e.lngLat.lat];
                    updateRulerLayer();

                    // Live distance update
                    const line = turf.lineString([rulerState.current.points[0], rulerState.current.tempPoint]);
                    const length = turf.length(line, { units: 'kilometers' });
                    onMeasure(`${length.toLocaleString(undefined, { maximumFractionDigits: 2 })} km`);
                }
            });

            map.current.on('mouseout', () => {
                onCoordinatesChange(null);
            });
        }
    }, [onMeasure, onCoordinatesChange]);

    // Handle Style Changes & Layer Architecture
    useEffect(() => {
        if (!map.current) return;

        const styleConfig = MAP_STYLES[activeLayer];

        const updateLayer = () => {
            if (!map.current) return;

            const sourceId = 'base-tiles';
            const layerId = 'base-layer';
            // Vector Labels
            const labelsSourceId = 'labels-vector-source';
            const placeLayerId = 'labels-place-layer';
            const countryLayerId = 'labels-country-layer';

            // Clean up
            if (map.current.getLayer(placeLayerId)) map.current.removeLayer(placeLayerId);
            if (map.current.getLayer(countryLayerId)) map.current.removeLayer(countryLayerId);
            if (map.current.getSource(labelsSourceId)) map.current.removeSource(labelsSourceId);

            // Clean up old raster labels if they exist
            if (map.current.getLayer('labels-layer')) map.current.removeLayer('labels-layer');
            if (map.current.getSource('labels-tiles')) map.current.removeSource('labels-tiles');

            if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
            if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

            // 1. Base Tile Layer
            let tileUrl = styleConfig.url.replace('{s}', 'a');
            let attribution = styleConfig.attribution;
            let maxZoom = styleConfig.maxzoom;

            if (activeLayer === 'satellite') {
                tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
                attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
                maxZoom = 19;
            }

            map.current.addSource(sourceId, {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: 256,
                attribution: attribution,
                maxzoom: maxZoom
            });

            map.current.addLayer({
                id: layerId,
                type: 'raster',
                source: sourceId,
                minzoom: 0,
                maxzoom: 22
            }, map.current.getStyle().layers?.[0]?.id);

            // 3. Vector Labels Overlay (OpenFreeMap)
            if (showLabels) {
                map.current.addSource(labelsSourceId, {
                    type: 'vector',
                    tiles: ['https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf'],
                    maxzoom: 14
                });

                const langKey = currentLang === 'en' ? 'name:en' : currentLang === 'it' ? 'name:it' : 'name:bg';
                const textField = ['coalesce', ['get', langKey], ['get', 'name:en'], ['get', 'name']];

                // FIX: Ensure text is visible on Relief (usually light)
                // Satellite is dark -> White text
                // Relief/Political/Topo are light -> Dark text
                const isDarkMap = activeLayer === 'satellite';
                const textColor = isDarkMap ? '#ffffff' : '#333333';
                const haloColor = isDarkMap ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';

                // Country Labels
                map.current.addLayer({
                    id: countryLayerId,
                    type: 'symbol',
                    source: labelsSourceId,
                    'source-layer': 'place',
                    minzoom: 0,
                    maxzoom: 22,
                    filter: ['==', 'class', 'country'],
                    layout: {
                        'text-field': textField,
                        'text-font': ['Noto Sans Bold'], // Standard OpenFreeMap font
                        'text-size': 14,
                        'text-transform': 'uppercase',
                        'text-letter-spacing': 0.1
                    },
                    paint: {
                        'text-color': textColor,
                        'text-halo-color': haloColor,
                        'text-halo-width': 2
                    }
                });

                // City/Place Labels
                map.current.addLayer({
                    id: placeLayerId,
                    type: 'symbol',
                    source: labelsSourceId,
                    'source-layer': 'place',
                    minzoom: 2,
                    maxzoom: 22,
                    filter: ['!=', 'class', 'country'],
                    layout: {
                        'text-field': textField,
                        'text-font': ['Noto Sans Regular'], // Standard OpenFreeMap font
                        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 10, 14],
                        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                        'text-radial-offset': 0.5,
                        'text-justify': 'auto'
                    },
                    paint: {
                        'text-color': textColor,
                        'text-halo-color': haloColor,
                        'text-halo-width': 1.5
                    }
                });
            }

            // Terrain
            const needsTerrain = ['relief', 'topo', 'satellite'].includes(activeLayer);
            if (needsTerrain) {
                if (!map.current.getSource('terrain-source')) {
                    map.current.addSource('terrain-source', {
                        type: 'raster-dem',
                        url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
                        tileSize: 256
                    });
                }
                map.current.setTerrain({ source: 'terrain-source', exaggeration: 1.5 });
            } else {
                map.current.setTerrain(null);
            }
        };

        if (map.current.loaded()) {
            updateLayer();
        } else {
            map.current.on('load', updateLayer);
        }

    }, [activeLayer, showLabels, currentLang]);

    // Handle Graticules (Grid) - Localized & Thicker
    useEffect(() => {
        if (!map.current) return;

        const sourceId = 'graticules-source';
        const layerId = 'graticules-layer';
        const labelLayerId = 'graticules-labels-layer';

        if (showGraticules) {
            const getCardinal = (dir: 'N' | 'S' | 'E' | 'W') => {
                if (currentLang === 'it') {
                    if (dir === 'W') return 'O';
                    return dir;
                }
                if (currentLang === 'bg') {
                    if (dir === 'N') return 'С';
                    if (dir === 'S') return 'Ю';
                    if (dir === 'E') return 'И';
                    if (dir === 'W') return 'З';
                    return dir;
                }
                return dir;
            };

            if (map.current.getSource(sourceId)) {
                if (map.current.getLayer(labelLayerId)) map.current.removeLayer(labelLayerId);
                if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
                if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
            }

            const features = [];
            const step = 10;
            const maxLat = 85;

            for (let lng = -180; lng <= 180; lng += step) {
                const dir = lng > 0 ? 'E' : lng < 0 ? 'W' : '';
                const suffix = dir ? getCardinal(dir as any) : '';
                features.push({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: [[lng, -maxLat], [lng, maxLat]] },
                    properties: { value: `${Math.abs(lng)}°${suffix}` }
                });
            }

            for (let lat = -80; lat <= 80; lat += step) {
                const dir = lat > 0 ? 'N' : lat < 0 ? 'S' : '';
                const suffix = dir ? getCardinal(dir as any) : '';
                features.push({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] },
                    properties: { value: `${Math.abs(lat)}°${suffix}` }
                });
            }

            const gridGeoJSON = { type: 'FeatureCollection', features: features };

            map.current.addSource(sourceId, {
                type: 'geojson',
                // @ts-ignore
                data: gridGeoJSON
            });

            const beforeLayer = map.current.getLayer('labels-place-layer') ? 'labels-place-layer' : undefined;

            const lineColor = activeLayer === 'satellite' ? 'rgba(0, 255, 255, 0.5)' : 'rgba(50, 50, 50, 0.4)';

            map.current.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': lineColor,
                    'line-width': 1.5,
                    'line-dasharray': [4, 2]
                }
            }, beforeLayer);

            const textColor = activeLayer === 'satellite' ? 'rgba(0, 255, 255, 0.9)' : 'rgba(50, 50, 50, 0.9)';
            const haloColor = activeLayer === 'satellite' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';

            map.current.addLayer({
                id: labelLayerId,
                type: 'symbol',
                source: sourceId,
                layout: {
                    'symbol-placement': 'line',
                    'text-field': ['get', 'value'],
                    'text-size': 11,
                    'text-offset': [0, 1],
                    'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                    'text-allow-overlap': false,
                    'text-ignore-placement': false
                },
                paint: {
                    'text-color': textColor,
                    'text-halo-color': haloColor,
                    'text-halo-width': 1
                }
            }, beforeLayer);

        } else {
            if (map.current.getLayer(labelLayerId)) map.current.removeLayer(labelLayerId);
            if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
            if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
        }

    }, [showGraticules, activeLayer, currentLang]);

    // Handle Weather Layers (Rain & Clouds)
    useEffect(() => {
        if (!map.current) return;

        const updateWeather = async () => {
            if (!map.current) return;

            const rainSourceId = 'weather-rain-source';
            const rainLayerId = 'weather-rain-layer';
            const cloudSourceId = 'weather-cloud-source';
            const cloudLayerId = 'weather-cloud-layer';

            try {
                // Fetch latest timestamp
                let latestTs = Math.floor(Date.now() / 1000) - 1000;
                try {
                    const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
                    const data = await response.json();
                    if (data.radar && data.radar.past && data.radar.past.length > 0) {
                        latestTs = data.radar.past[data.radar.past.length - 1].time;
                    }
                } catch (err) {
                    console.warn("Weather fetch failed, using local time", err);
                }

                setDebugInfo(prev => ({ ...prev, weatherTs: latestTs.toString() }));

                // Insert below labels but above base/grid
                // Try to find a good insertion point
                const beforeLayer = map.current.getLayer('labels-country-layer') ? 'labels-country-layer' :
                    map.current.getLayer('graticules-layer') ? 'graticules-layer' : undefined;

                // --- Rain ---
                // Always remove first to ensure clean state if toggling rapidly
                if (map.current.getLayer(rainLayerId)) map.current.removeLayer(rainLayerId);
                if (map.current.getSource(rainSourceId)) map.current.removeSource(rainSourceId);

                if (showWeather) {
                    map.current.addSource(rainSourceId, {
                        type: 'raster',
                        tiles: [`https://tile.rainviewer.com/${latestTs}/256/{z}/{x}/{y}/2/1_1.png`],
                        tileSize: 256,
                        attribution: 'Weather data &copy; RainViewer'
                    });
                    map.current.addLayer({
                        id: rainLayerId,
                        type: 'raster',
                        source: rainSourceId,
                        paint: { 'raster-opacity': 0.7 }
                    }, beforeLayer);
                }

                // --- Clouds ---
                if (map.current.getLayer(cloudLayerId)) map.current.removeLayer(cloudLayerId);
                if (map.current.getSource(cloudSourceId)) map.current.removeSource(cloudSourceId);

                if (showClouds) {
                    map.current.addSource(cloudSourceId, {
                        type: 'raster',
                        tiles: [`https://tile.rainviewer.com/${latestTs}/256/{z}/{x}/{y}/0/0_0.png`],
                        tileSize: 256
                    });
                    map.current.addLayer({
                        id: cloudLayerId,
                        type: 'raster',
                        source: cloudSourceId,
                        paint: { 'raster-opacity': 0.6 }
                    }, beforeLayer);
                }

            } catch (e) {
                console.error("Failed to load weather data", e);
                setDebugInfo(prev => ({ ...prev, weatherTs: 'ERROR' }));
            }
        };

        updateWeather();

    }, [showWeather, showClouds]);

    return (
        <div className="map-wrap">
            <div
                ref={mapContainer}
                className={`map ${activeTool ? `tool-${activeTool}` : ''}`}
            />

            {/* Diagnostic Panel */}
            <div style={{
                position: 'absolute',
                bottom: '100px',
                left: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '10px',
                fontSize: '10px',
                fontFamily: 'monospace',
                zIndex: 9999,
                pointerEvents: 'none',
                borderRadius: '4px'
            }}>
                <div>Zoom: {debugInfo.zoom}</div>
                <div>Weather TS: {debugInfo.weatherTs}</div>
                <div>Layers ({debugInfo.layers.length}):</div>
                <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                    {debugInfo.layers.map(l => <div key={l}>{l}</div>)}
                </div>
            </div>

            {/* Custom Zoom Controls */}
            <div className="custom-zoom-controls">
                <button
                    className="zoom-btn"
                    onClick={() => map.current?.zoomIn()}
                    title="Zoom In"
                >
                    +
                </button>
                <button
                    className="zoom-btn"
                    onClick={() => map.current?.zoomOut()}
                    title="Zoom Out"
                >
                    -
                </button>
            </div>
        </div>
    );
});

export default MapContainer;

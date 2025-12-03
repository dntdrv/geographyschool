import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapContainer.css';
import { MAP_STYLES, type MapStyleId } from './mapStyles';
import * as turf from '@turf/turf';
import type { Language } from '../UI/LanguageSwitcher';
import { translations } from '../../utils/translations';

export interface MapContainerProps {
    onMeasure: (measurement: string) => void;
    activeLayer: MapStyleId;
    showGraticules: boolean;
    showLabels: boolean;
    showBorders: boolean;
    showTemperature: boolean;
    currentLang: Language;
    onCoordinatesChange: (coords: { lat: number; lng: number; zoom: number } | null) => void;
    activeToolRef: React.MutableRefObject<string | null>;
    onToolChangeRef: React.MutableRefObject<(tool: string | null) => void>;
}

export interface MapRef {
    flyToLocation: (center: [number, number], zoom: number, bbox?: [number, number, number, number]) => void;
    setTool: (tool: string) => void;
    clearMeasurement: () => void;
    getMap: () => maplibregl.Map | null;
    locateMe: () => void;
}

const MapContainer = forwardRef<MapRef, MapContainerProps>(({
    onMeasure,
    activeLayer,
    showGraticules,
    showLabels,
    showBorders,
    showTemperature,
    currentLang,
    onCoordinatesChange,
    activeToolRef,
    onToolChangeRef
}, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const lastActiveLayer = useRef<MapStyleId | null>(null); // Initialize as null to force first update
    const markers = useRef<maplibregl.Marker[]>([]);

    // Ruler State
    const rulerState = useRef<{ active: boolean; points: number[][]; tempPoint: number[] | null }>({
        active: false,
        points: [],
        tempPoint: null
    });

    // Helper to update ruler layer
    const updateRulerLayer = () => {
        if (!map.current || !map.current.getSource('ruler-source')) return;

        const source = map.current.getSource('ruler-source') as maplibregl.GeoJSONSource;
        const features: any[] = [];

        if (rulerState.current.points.length > 0) {
            // Points
            rulerState.current.points.forEach(pt => {
                features.push(turf.point(pt));
            });

            // Line
            if (rulerState.current.points.length > 1) {
                features.push(turf.lineString(rulerState.current.points));
            }

            // Temp Line (rubber band)
            if (rulerState.current.tempPoint && rulerState.current.points.length > 0) {
                const lastPoint = rulerState.current.points[rulerState.current.points.length - 1];
                features.push(turf.lineString([lastPoint, rulerState.current.tempPoint]));
            }
        }

        source.setData({ type: 'FeatureCollection', features });
    };

    // Helper to set active tool
    const setActiveTool = (tool: string | null) => {
        if (!map.current || !mapContainer.current) return;

        // Reset previous state
        rulerState.current = { active: false, points: [], tempPoint: null };
        updateRulerLayer();
        map.current.getCanvas().style.cursor = '';
        mapContainer.current.classList.remove('tool-draw', 'tool-measure', 'tool-marker');

        if (tool === 'measure-distance') {
            rulerState.current.active = true;
            map.current.getCanvas().style.cursor = 'crosshair';
            mapContainer.current.classList.add('tool-measure');
        } else if (tool === 'marker') {
            map.current.getCanvas().style.cursor = 'pointer';
            mapContainer.current.classList.add('tool-marker');
        }
    };

    useImperativeHandle(ref, () => ({
        flyToLocation: (center, zoom, bbox) => {
            if (bbox) {
                map.current?.fitBounds(bbox as [number, number, number, number], { padding: 50 });
            } else {
                map.current?.flyTo({ center, zoom });
            }
        },
        setTool: (tool) => {
            setActiveTool(tool === 'none' ? null : tool);
        },
        clearMeasurement: () => {
            rulerState.current = { active: false, points: [], tempPoint: null };
            updateRulerLayer();
            setActiveTool(null);
            onToolChangeRef.current(null);
        },
        getMap: () => map.current,
        locateMe: () => {
            if (!map.current) return;
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        map.current?.flyTo({
                            center: [longitude, latitude],
                            zoom: 14,
                            essential: true
                        });

                        // Add a blue dot marker
                        new maplibregl.Marker({ color: '#3b82f6' })
                            .setLngLat([longitude, latitude])
                            .addTo(map.current!);
                    },
                    (error) => {
                        console.error("Geolocation error:", error);
                        alert("Could not get your location.");
                    }
                );
            } else {
                alert("Geolocation is not supported by this browser.");
            }
        }
    }));

    // Initialize Map
    useEffect(() => {
        if (map.current) return; // Initialize only once

        if (!mapContainer.current) {
            console.error("Map container ref is null");
            return;
        }

        try {
            // Initialize with empty style to avoid flash of wrong style/colorful map
            const initialStyle = { version: 8, sources: {}, layers: [] };

            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: initialStyle as any, // Cast to any to avoid type complaints with empty style
                center: [20, 50], // Europe centered
                zoom: 3.5,
                maxZoom: 18,
                attributionControl: false,
                preserveDrawingBuffer: true,
                trackResize: true
            });

            map.current.on('load', () => {
                console.log("Map Loaded Successfully");
                setIsMapLoaded(true);

                if (!map.current) return;

                // Initialize Slot Architecture
                const slots = ['slot-base', 'slot-data', 'slot-roads', 'slot-ui'];
                slots.forEach(slotId => {
                    if (!map.current?.getLayer(slotId)) {
                        map.current?.addLayer({
                            id: slotId,
                            type: 'background',
                            paint: { 'background-color': 'rgba(0,0,0,0)' }
                        });
                    }
                });

                // Initialize Ruler Source/Layers
                map.current.addSource('ruler-source', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                });

                map.current.addLayer({
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

                map.current.addLayer({
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

            map.current.on('error', (e) => {
                console.error("MapLibre Error:", e);
            });

            // Click Handler
            map.current.on('click', (e) => {
                if (!map.current) return;

                if (rulerState.current.active) {
                    rulerState.current.points.push([e.lngLat.lng, e.lngLat.lat]);
                    updateRulerLayer();

                    if (rulerState.current.points.length > 1) {
                        const line = turf.lineString(rulerState.current.points);
                        const length = turf.length(line, { units: 'kilometers' });
                        onMeasure(`${length.toLocaleString(undefined, { maximumFractionDigits: 2 })} km`);

                        // Stop measuring after 2 points
                        rulerState.current.active = false;
                        map.current.getCanvas().style.cursor = '';
                        if (mapContainer.current) {
                            mapContainer.current.classList.remove('tool-measure');
                        }
                        activeToolRef.current = null;
                        onToolChangeRef.current(null);
                    }
                    return;
                }

                if (activeToolRef.current === 'marker') {
                    const marker = new maplibregl.Marker({ color: '#ef4444' })
                        .setLngLat(e.lngLat)
                        .addTo(map.current);

                    // Calculate tile coordinates for zoom level 15
                    const n = Math.pow(2, 15);
                    const xTile = Math.floor(n * ((e.lngLat.lng + 180) / 360));
                    const latRad = e.lngLat.lat * Math.PI / 180;
                    const yTile = Math.floor(n * (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2);

                    // Esri World Imagery Tile URL (Free)
                    const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/${yTile}/${xTile}`;

                    const t = translations[currentLang].marker;

                    const popupContent = document.createElement('div');
                    popupContent.className = 'glass-popup-content';
                    popupContent.innerHTML = `
                        <div style="color: var(--color-text); padding: 8px; min-width: 200px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></div>
                                <strong style="font-size: 14px;">${t.selectedLocation}</strong>
                            </div>
                            
                            <div style="margin-bottom: 12px; border-radius: 8px; overflow: hidden; height: 120px; background: #eee; position: relative;">
                                <img src="${tileUrl}" alt="Satellite Preview" style="width: 100%; height: 100%; object-fit: cover;" />
                                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; font-size: 10px; padding: 2px 6px; text-align: center;">Esri World Imagery</div>
                            </div>

                            <div style="background: rgba(0,0,0,0.05); padding: 8px; border-radius: 6px; margin-bottom: 12px; font-family: monospace; font-size: 11px;">
                                <div>${t.lat}: ${e.lngLat.lat.toFixed(5)}</div>
                                <div>${t.lng}: ${e.lngLat.lng.toFixed(5)}</div>
                            </div>

                            <a href="https://www.google.com/maps?q=${e.lngLat.lat},${e.lngLat.lng}" target="_blank" 
                               style="display: flex; align-items: center; justify-content: center; gap: 6px; background: #3b82f6; color: white; text-decoration: none; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 500; transition: opacity 0.2s;">
                                <span>${t.openInGoogleMaps}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </a>
                            
                            <button id="remove-marker-btn" style="margin-top: 8px; background: transparent; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px; border-radius: 6px; cursor: pointer; width: 100%; font-size: 11px; transition: all 0.2s;">
                                ${t.removeMarker}
                            </button>
                        </div>
                    `;

                    const removeBtn = popupContent.querySelector('#remove-marker-btn');
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            marker.remove();
                            markers.current = markers.current.filter(m => m !== marker);
                        });
                    }

                    const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
                        .setDOMContent(popupContent);

                    marker.setPopup(popup);
                    marker.togglePopup();
                    markers.current.push(marker);

                    // Reset tool
                    setActiveTool(null);
                    activeToolRef.current = null;
                    onToolChangeRef.current(null);
                }
            });

            // Mouse Move
            map.current.on('move', () => {
                if (map.current && onCoordinatesChange) {
                    const center = map.current.getCenter();
                    const zoom = map.current.getZoom();
                    onCoordinatesChange({ lat: center.lat, lng: center.lng, zoom });
                }
            });

            map.current.on('mousemove', (e) => {
                if (onCoordinatesChange && map.current) {
                    const zoom = map.current.getZoom();
                    onCoordinatesChange({ lat: e.lngLat.lat, lng: e.lngLat.lng, zoom });
                }

                // Ruler Logic
                if (rulerState.current.active && rulerState.current.points.length > 0) {
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

        } catch (error) {
            console.error("Error initializing map:", error);
        }

        return () => {
            map.current?.remove();
        };
    }, []);

    // Helper: Update Language
    const updateLanguage = () => {
        if (!map.current) return;
        const style = map.current.getStyle();
        if (!style || !style.layers) return;

        const langField = currentLang === 'en' ? 'name:en' :
            currentLang === 'bg' ? 'name:bg' :
                currentLang === 'it' ? 'name:it' : 'name';

        style.layers.forEach(layer => {
            if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
                try {
                    map.current?.setLayoutProperty(layer.id, 'text-field', [
                        "coalesce",
                        ["get", langField],
                        ["get", "name:en"],
                        ["get", "name"]
                    ]);
                } catch (e) { }
            }
        });
    };

    // Handle Style Changes & Toggles
    useEffect(() => {
        if (!map.current || !isMapLoaded) return;

        const initSlots = () => {
            if (!map.current) return;
            const slots = ['slot-base', 'slot-data', 'slot-roads', 'slot-ui'];
            slots.forEach(slotId => {
                if (!map.current?.getLayer(slotId)) {
                    map.current?.addLayer({
                        id: slotId,
                        type: 'background',
                        paint: { 'background-color': 'rgba(0,0,0,0)' }
                    });
                }
            });
        };

        const updateOverlays = () => {
            if (!map.current) return;
            initSlots();

            // Graticules
            const graticulesSourceId = 'graticules-source';
            const graticulesLayerId = 'graticules-layer';
            const graticulesLabelLayerId = 'graticules-labels';

            if (map.current.getSource(graticulesSourceId)) {
                if (map.current.getLayer(graticulesLabelLayerId)) map.current.removeLayer(graticulesLabelLayerId);
                if (map.current.getLayer(graticulesLayerId)) map.current.removeLayer(graticulesLayerId);
                map.current.removeSource(graticulesSourceId);
            }

            if (showGraticules) {
                const features: any[] = [];
                for (let lng = -180; lng <= 180; lng += 10) {
                    features.push({
                        type: 'Feature',
                        properties: { value: `${lng}°` },
                        geometry: { type: 'LineString', coordinates: [[lng, -90], [lng, 90]] }
                    });
                }
                for (let lat = -80; lat <= 80; lat += 10) {
                    features.push({
                        type: 'Feature',
                        properties: { value: `${lat}°` },
                        geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] }
                    });
                }

                map.current.addSource(graticulesSourceId, {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features }
                });

                map.current.addLayer({
                    id: graticulesLayerId,
                    type: 'line',
                    source: graticulesSourceId,
                    paint: { 'line-color': '#000000', 'line-opacity': 0.3, 'line-width': 1 }
                });

                map.current.addLayer({
                    id: graticulesLabelLayerId,
                    type: 'symbol',
                    source: graticulesSourceId,
                    layout: {
                        'symbol-placement': 'line',
                        'text-field': ['get', 'value'],
                        'text-size': 10,
                        'text-offset': [0, 1],
                        'text-font': ['Open Sans Regular']
                    },
                    paint: { 'text-color': '#000000', 'text-halo-color': '#ffffff', 'text-halo-width': 2 }
                });
            }

            // Temperature (NASA GIBS)
            const tempSourceId = 'temp-source';
            const tempLayerId = 'temp-layer';

            try {
                if (map.current.getSource(tempSourceId)) {
                    if (map.current.getLayer(tempLayerId)) map.current.removeLayer(tempLayerId);
                    map.current.removeSource(tempSourceId);
                }

                if (showTemperature) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const dateStr = yesterday.toISOString().split('T')[0];
                    const tileUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/${dateStr}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`;

                    map.current.addSource(tempSourceId, {
                        type: 'raster',
                        tiles: [tileUrl],
                        tileSize: 256,
                        attribution: 'NASA GIBS'
                    });

                    map.current.addLayer({
                        id: tempLayerId,
                        type: 'raster',
                        source: tempSourceId,
                        paint: { 'raster-opacity': 0.6 }
                    });
                }
            } catch (e) { console.error("Error adding temp:", e); }

            // Borders
            const bordersSourceId = 'borders-source';
            const bordersLayerId = 'borders-layer';

            if (map.current.getSource(bordersSourceId)) {
                if (map.current.getLayer(bordersLayerId)) map.current.removeLayer(bordersLayerId);
                map.current.removeSource(bordersSourceId);
            }

            if (showBorders) {
                map.current.addSource(bordersSourceId, {
                    type: 'geojson',
                    data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson'
                });

                map.current.addLayer({
                    id: bordersLayerId,
                    type: 'line',
                    source: bordersSourceId,
                    paint: { 'line-color': '#333333', 'line-width': 1.5 }
                }, 'slot-ui');
            }
        };

        const updateMapState = () => {
            if (!map.current) return;

            const layerConfig = MAP_STYLES[activeLayer];
            if (!layerConfig) return;

            if (activeLayer !== lastActiveLayer.current) {
                lastActiveLayer.current = activeLayer;

                if (layerConfig.type === 'style') {
                    // Vector Style
                    map.current.setStyle(layerConfig.url);
                    map.current.once('styledata', () => {
                        initSlots();
                        updateLanguage();
                        updateOverlays();

                        // Restore Ruler
                        if (!map.current?.getSource('ruler-source')) {
                            map.current?.addSource('ruler-source', {
                                type: 'geojson',
                                data: { type: 'FeatureCollection', features: [] }
                            });
                            map.current?.addLayer({
                                id: 'ruler-line',
                                type: 'line',
                                source: 'ruler-source',
                                paint: { 'line-color': '#3b82f6', 'line-width': 3, 'line-dasharray': [2, 1] },
                                filter: ['==', '$type', 'LineString']
                            });
                            map.current?.addLayer({
                                id: 'ruler-points',
                                type: 'circle',
                                source: 'ruler-source',
                                paint: { 'circle-radius': 5, 'circle-color': '#3b82f6', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' },
                                filter: ['==', '$type', 'Point']
                            });
                        }
                    });
                } else {
                    // Raster Style
                    const baseSourceId = 'base-tiles-source';
                    const baseLayerId = 'base-tiles-layer';
                    const labelsSourceId = 'labels-source';
                    const labelsLayerId = 'labels-layer';

                    if (map.current.getLayer(baseLayerId)) map.current.removeLayer(baseLayerId);
                    if (map.current.getSource(baseSourceId)) map.current.removeSource(baseSourceId);
                    if (map.current.getLayer(labelsLayerId)) map.current.removeLayer(labelsLayerId);
                    if (map.current.getSource(labelsSourceId)) map.current.removeSource(labelsSourceId);

                    map.current.addSource(baseSourceId, {
                        type: 'raster',
                        tiles: [layerConfig.url],
                        tileSize: 256,
                        attribution: layerConfig.attribution
                    });

                    initSlots();

                    map.current.addLayer({
                        id: baseLayerId,
                        type: 'raster',
                        source: baseSourceId,
                        paint: { 'raster-opacity': 1 }
                    }, 'slot-base');

                    if (showLabels && layerConfig.labelsUrl) {
                        map.current.addSource(labelsSourceId, {
                            type: 'raster',
                            tiles: [layerConfig.labelsUrl],
                            tileSize: 256
                        });
                        map.current.addLayer({
                            id: labelsLayerId,
                            type: 'raster',
                            source: labelsSourceId,
                            paint: { 'raster-opacity': 1 }
                        }, 'slot-ui');
                    }

                    updateOverlays();
                }
            } else {
                updateOverlays();

                // Handle Raster Labels Toggle
                if (layerConfig.type === 'raster') {
                    const labelsSourceId = 'labels-source';
                    const labelsLayerId = 'labels-layer';
                    if (showLabels && layerConfig.labelsUrl) {
                        if (!map.current.getLayer(labelsLayerId)) {
                            if (!map.current.getSource(labelsSourceId)) {
                                map.current.addSource(labelsSourceId, {
                                    type: 'raster',
                                    tiles: [layerConfig.labelsUrl],
                                    tileSize: 256
                                });
                            }
                            map.current.addLayer({
                                id: labelsLayerId,
                                type: 'raster',
                                source: labelsSourceId,
                                paint: { 'raster-opacity': 1 }
                            }, 'slot-ui');
                        }
                    } else {
                        if (map.current.getLayer(labelsLayerId)) map.current.removeLayer(labelsLayerId);
                    }
                }
            }
        };

        updateMapState();

    }, [activeLayer, showLabels, showBorders, showGraticules, showTemperature, isMapLoaded]);

    // Language Update Effect
    useEffect(() => {
        if (isMapLoaded) {
            updateLanguage();
        }
    }, [currentLang, isMapLoaded, activeLayer]);

    return (
        <div className="map-wrapper">
            <div ref={mapContainer} className="map-container" />
        </div>
    );
});

export default MapContainer;

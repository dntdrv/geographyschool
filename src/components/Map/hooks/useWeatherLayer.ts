import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface UseWeatherLayerProps {
    map: React.MutableRefObject<maplibregl.Map | null>;
    isMapLoaded: boolean;
    showWeather: boolean;
    showTemperature: boolean;
    setDebugInfo: React.Dispatch<React.SetStateAction<any>>;
}

export const useWeatherLayer = ({
    map,
    isMapLoaded,
    showWeather,
    showTemperature,
    setDebugInfo
}: UseWeatherLayerProps) => {

    useEffect(() => {
        if (!map.current || !isMapLoaded) return;

        const rainSourceId = 'weather-rain-source';
        const rainLayerId = 'weather-rain-layer';
        const tempSourceId = 'weather-temp-source';
        const tempLayerId = 'weather-temp-layer';

        // Cleanup function
        const cleanupLayers = () => {
            if (map.current?.getLayer(rainLayerId)) map.current.removeLayer(rainLayerId);
            if (map.current?.getSource(rainSourceId)) map.current.removeSource(rainSourceId);
            if (map.current?.getLayer(tempLayerId)) map.current.removeLayer(tempLayerId);
            if (map.current?.getSource(tempSourceId)) map.current.removeSource(tempSourceId);
        };

        const updateWeather = async () => {
            if (!map.current) return;

            if (!showWeather && !showTemperature) {
                cleanupLayers();
                setDebugInfo((prev: any) => ({ ...prev, weatherTs: 'OFF' }));
                return;
            }

            try {
                // --- 1. Rain (RainViewer) ---
                // We fetch the latest available timestamp from RainViewer API
                let rainTileUrl = '';
                if (showWeather) {
                    try {
                        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
                        const data = await response.json();

                        // Get the last "past" frame (most recent observed data)
                        if (data.radar && data.radar.past && data.radar.past.length > 0) {
                            const lastPastFrame = data.radar.past[data.radar.past.length - 1];
                            const host = data.host;
                            const path = lastPastFrame.path;
                            // Construct URL: {host}{path}/256/{z}/{x}/{y}/2/1_1.png
                            // Color 2 = Universal Blue
                            // Options 1_1 = Smooth + Snow
                            rainTileUrl = `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;
                            setDebugInfo((prev: any) => ({ ...prev, weatherTs: `Rain: ${new Date(lastPastFrame.time * 1000).toLocaleTimeString()}` }));
                        }
                    } catch (err) {
                        console.error('Failed to fetch RainViewer data', err);
                        setDebugInfo((prev: any) => ({ ...prev, weatherTs: 'Rain Fetch Error' }));
                    }
                }

                // --- NASA GIBS Date Strategy ---
                // Data availability can lag by 1-2 days. To be safe and avoid 400 errors, we use 2 days ago.
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() - 1); // Try 1 day ago for VIIRS
                const gibsDate = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

                // 2. Temperature: VIIRS SNPP Land Surface Temp Day (Better coverage than MODIS)
                // Level 7 = ~1km resolution
                const tempUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_Land_Surface_Temp_Day/default/${gibsDate}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`;

                if (!rainTileUrl && showWeather) {
                    // Fallback if RainViewer fails? Or just don't show it.
                    // We'll leave it empty so it doesn't error.
                }

                const insertBefore = 'slot-roads'; // Weather goes under roads

                // --- Temperature (NASA GIBS) ---
                if (showTemperature) {
                    if (map.current.getLayer(tempLayerId)) map.current.removeLayer(tempLayerId);
                    if (map.current.getSource(tempSourceId)) map.current.removeSource(tempSourceId);

                    map.current.addSource(tempSourceId, {
                        type: 'raster',
                        tiles: [tempUrl],
                        tileSize: 256,
                        attribution: 'Data &copy; NASA GIBS (VIIRS)',
                        maxzoom: 7
                    });

                    map.current.addLayer({
                        id: tempLayerId,
                        type: 'raster',
                        source: tempSourceId,
                        paint: { 'raster-opacity': 0.6 }
                    }, 'slot-data');
                } else {
                    if (map.current.getLayer(tempLayerId)) map.current.removeLayer(tempLayerId);
                    if (map.current.getSource(tempSourceId)) map.current.removeSource(tempSourceId);
                }

                // --- Rain (RainViewer) ---
                if (showWeather && rainTileUrl) {
                    if (map.current.getLayer(rainLayerId)) map.current.removeLayer(rainLayerId);
                    if (map.current.getSource(rainSourceId)) map.current.removeSource(rainSourceId);

                    map.current.addSource(rainSourceId, {
                        type: 'raster',
                        tiles: [rainTileUrl],
                        tileSize: 256,
                        attribution: 'Data &copy; RainViewer',
                        maxzoom: 12
                    });

                    map.current.addLayer({
                        id: rainLayerId,
                        type: 'raster',
                        source: rainSourceId,
                        paint: { 'raster-opacity': 0.7 }
                    }, insertBefore);
                } else {
                    if (map.current.getLayer(rainLayerId)) map.current.removeLayer(rainLayerId);
                    if (map.current.getSource(rainSourceId)) map.current.removeSource(rainSourceId);
                }

            } catch (e) {
                console.error("Critical Weather Error", e);
                setDebugInfo((prev: any) => ({ ...prev, weatherTs: 'CRITICAL ERR' }));
            }
        };

        updateWeather();

        // Check for updates every 10 minutes
        const intervalId = setInterval(updateWeather, 600000);

        return () => {
            clearInterval(intervalId);
            cleanupLayers();
        };

    }, [showWeather, showTemperature, isMapLoaded, map, setDebugInfo]);
};

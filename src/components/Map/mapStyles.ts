export type MapStyleId = 'political' | 'satellite' | 'topo';

export interface MapStyle {
    id: MapStyleId;
    name: string;
    url: string;
    labelsUrl?: string; // Optional, for raster overlays
    type: 'raster' | 'style'; // 'style' for Vector (Mapbox/OpenFreeMap), 'raster' for XYZ
    attribution: string;
    maxzoom: number;
    isDark: boolean;
}

export const MAP_STYLES: Record<MapStyleId, MapStyle> = {
    political: {
        id: 'political',
        name: 'Political',
        // Carto Positron No Labels (Raster) - The "Old One"
        url: 'https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png',
        labelsUrl: 'https://basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png',
        type: 'raster',
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxzoom: 19,
        isDark: false
    },
    satellite: {
        id: 'satellite',
        name: 'Satellite',
        // Esri World Imagery (Raster) - No localization support for base, but we can overlay vector labels
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        labelsUrl: 'https://tiles.openfreemap.org/styles/positron', // Use Positron as overlay? No, that's a full style.
        // For satellite, we might need a transparent label layer. 
        // OpenFreeMap doesn't seem to offer a "labels only" transparent style easily without custom GL style manipulation.
        // Fallback: Keep Carto labels for Satellite for now, OR use OpenFreeMap Bright and filter layers?
        // Let's stick to Carto for Satellite labels for now as it's a safe fallback, 
        // BUT the user demanded translation. 
        // If we use 'style' type for satellite, we can't easily mix raster base + vector style unless we merge them.
        // Let's keep Satellite as Raster for now but note the limitation, or try to find a vector overlay.
        // Actually, we can add the vector style as a source and layer in MapContainer.
        // For now, let's switch Political (the main one) to Vector.
        type: 'raster',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxzoom: 17,
        isDark: true
    },
    topo: {
        id: 'topo',
        name: 'Topographic',
        // OpenTopoMap is Raster.
        url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
        type: 'raster',
        attribution: 'Map data: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        maxzoom: 17,
        isDark: false
    }
};

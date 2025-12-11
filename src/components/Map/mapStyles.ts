export type MapStyleId = 'political' | 'satellite';

export interface MapStyle {
    id: MapStyleId;
    name: string;
    url: string;
    labelsUrl?: string;           // Raster labels (fallback)
    vectorLabelsStyle?: string;   // Vector labels style URL for multilingual support
    type: 'raster' | 'style';
    attribution: string;
    maxzoom: number;
    isDark: boolean;
}

// OpenFreeMap vector tiles for multilingual labels
// Contains name:en, name:bg, name:de, name:it, etc.
export const VECTOR_LABELS_STYLE = 'https://tiles.openfreemap.org/styles/bright';

export const MAP_STYLES: Record<MapStyleId, MapStyle> = {
    political: {
        id: 'political',
        name: 'Political',
        url: 'https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png',
        labelsUrl: 'https://basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png',
        vectorLabelsStyle: VECTOR_LABELS_STYLE,
        type: 'raster',
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxzoom: 19,
        isDark: false
    },
    satellite: {
        id: 'satellite',
        name: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        labelsUrl: 'https://basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png',
        vectorLabelsStyle: VECTOR_LABELS_STYLE,
        type: 'raster',
        attribution: 'Tiles &copy; Esri',
        maxzoom: 17,
        isDark: true
    }
};


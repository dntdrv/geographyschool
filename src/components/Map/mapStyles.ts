export type MapStyleId = 'political' | 'relief' | 'satellite' | 'topo';

export interface MapStyle {
    id: MapStyleId;
    name: string;
    url: string;
    type: 'raster' | 'style';
    attribution: string;
    maxzoom: number;
    isDark: boolean;
}

export const MAP_STYLES: Record<MapStyleId, MapStyle> = {
    political: {
        id: 'political',
        name: 'Political',
        // Carto Positron No Labels
        url: 'https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png',
        type: 'raster',
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a> | <strong>Developed by Eptesicus Labs</strong>',
        maxzoom: 19,
        isDark: false
    },
    relief: {
        id: 'relief',
        name: 'Relief',
        // Esri World Physical Map (Labels are baked in, no free alternative without labels easily available, keeping as is for now but looking for options)
        // Actually, let's try to use a different source if possible, but Esri Physical is standard.
        // For now, we keep it but acknowledge limitation.
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
        type: 'raster',
        attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service | <strong>Developed by Eptesicus Labs</strong>',
        maxzoom: 11,
        isDark: false
    },
    satellite: {
        id: 'satellite',
        name: 'Satellite',
        // Esri World Imagery (No labels by default)
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        type: 'raster',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community | <strong>Developed by Eptesicus Labs</strong>',
        maxzoom: 17,
        isDark: true
    },
    topo: {
        id: 'topo',
        name: 'Topographic',
        // Esri World Shaded Relief (No labels)
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
        type: 'raster',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
        maxzoom: 13,
        isDark: false
    }
};



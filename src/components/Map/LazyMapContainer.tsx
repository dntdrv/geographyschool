import React, { Suspense } from 'react';
import type { MapRef, MapContainerProps } from './MapContainer';

// Lazy load the heavy MapContainer
const MapContainer = React.lazy(() => import('./MapContainer'));

const LazyMapContainer = React.forwardRef<MapRef, MapContainerProps>((props, ref) => {
    return (
        <Suspense fallback={<div className="map-wrapper" style={{ background: '#f0f0f0' }} />}>
            <MapContainer {...props} ref={ref} />
        </Suspense>
    );
});

export default LazyMapContainer;

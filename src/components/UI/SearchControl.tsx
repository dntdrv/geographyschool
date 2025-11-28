import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
// Actually, Overlay doesn't have access to map instance directly.
// We should probably pass a callback "onLocationSelect" to Overlay, which calls map.flyTo.
// But wait, MapContainer exposes methods via ref. App.tsx has the ref.
// So Overlay needs onLocationSelect prop.

// Let's adjust the plan: SearchControl will just return a lat/lng/zoom, and Overlay will call a prop.
// BUT, Overlay doesn't have a prop for "flyToLocation".
// I need to add `onLocationSelect` to OverlayProps in Overlay.tsx first?
// Or I can just pass the map instance? No, that's messy.

// Let's implement SearchControl to handle the UI and fetching, and pass `onResult` to it.
// `onResult` will take { center: [lng, lat], zoom: number, bbox?: [minLng, minLat, maxLng, maxLat] }

// Wait, I can't easily change App.tsx and Overlay.tsx again without more tool calls.
// Is there a simpler way?
// App.tsx has `mapRef`. `mapRef` has `flyToContinent`. I can add `flyToLocation` to `MapRef`.
// I already removed `flyToContinent`.
// I should add `flyTo(center, zoom)` to `MapRef`.

// Let's do this:
// 1. Create SearchControl.tsx (UI only + fetch logic).
// 2. Update MapContainer.tsx to expose `flyToLocation`.
// 3. Update App.tsx to pass `flyToLocation` to Overlay -> SearchControl.
// 4. Update Overlay.tsx to accept `onLocationSelect`.

// Actually, I can just use the existing `mapRef` in App.tsx.
// But I need to pass the function down.

// Let's start by creating SearchControl.tsx.

import './SearchControl.css';

interface SearchResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    boundingbox: string[];
}

interface SearchControlProps {
    isDark: boolean;
    placeholder: string;
    onResult: (result: { center: [number, number]; zoom?: number; bbox?: [number, number, number, number] }) => void;
}

const SearchControl: React.FC<SearchControlProps> = ({ isDark, placeholder, onResult }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResults([]);
        setIsOpen(false);

        // 1. Check for Coordinates (Lat, Lng)
        // Regex for "lat, lng" or "lat lng"
        const coordRegex = /^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/;
        const match = query.match(coordRegex);

        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[3]);

            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                const result: SearchResult = {
                    place_id: -1, // Synthetic ID
                    display_name: `Coordinates: ${lat}, ${lng}`,
                    lat: lat.toString(),
                    lon: lng.toString(),
                    boundingbox: [(lat - 0.1).toString(), (lat + 0.1).toString(), (lng - 0.1).toString(), (lng + 0.1).toString()]
                };
                setResults([result]);
                setIsOpen(true);
                setLoading(false);
                return;
            }
        }

        // 2. Nominatim Search
        try {
            // Accept-Language: en,it,bg
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&accept-language=en,it,bg`);
            const data: SearchResult[] = await response.json();

            // Deduplicate by place_id and display_name
            const uniqueResults = data.filter((item, index, self) =>
                index === self.findIndex((t) => (
                    t.place_id === item.place_id || t.display_name === item.display_name
                ))
            ).slice(0, 5); // Limit to 5 unique results

            setResults(uniqueResults);
            setIsOpen(true);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const bbox = result.boundingbox.map(parseFloat);
        // bbox from nominatim is [minLat, maxLat, minLon, maxLon]
        // MapLibre expects [minLng, minLat, maxLng, maxLat]
        const mapBbox: [number, number, number, number] = [bbox[2], bbox[0], bbox[3], bbox[1]];

        onResult({
            center: [lng, lat],
            bbox: mapBbox
        });
        setIsOpen(false);
        setQuery(result.display_name.split(',')[0]); // Shorten name in input
    };

    return (
        <div className={`search-control ${isDark ? 'dark' : 'light'}`} ref={wrapperRef}>
            <form onSubmit={handleSearch} className="search-form">
                {loading ? (
                    <Loader2 size={18} className="search-icon animate-spin" />
                ) : (
                    <Search size={18} className="search-icon" />
                )}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="search-input"
                />
                {query && (
                    <button type="button" className="clear-btn" onClick={() => setQuery('')}>
                        <X size={16} />
                    </button>
                )}
            </form>

            {isOpen && results.length > 0 && (
                <div className="search-results">
                    {results.map((result) => (
                        <div
                            key={result.place_id}
                            className="search-result-item"
                            onClick={() => handleSelect(result)}
                        >
                            {result.display_name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchControl;

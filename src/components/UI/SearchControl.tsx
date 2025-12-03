import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './SearchControl.css';

interface SearchControlProps {
    placeholder: string;
    onResult: (location: any) => void;
}

const spring: any = {
    type: "spring",
    stiffness: 300,
    damping: 20
};

const SearchControl: React.FC<SearchControlProps> = ({ placeholder, onResult }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();
            setResults(data);
            setShowResults(true);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="search-control-wrapper">
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    className="search-input-glass"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
                {isLoading && <Loader2 className="search-spinner" size={16} />}
            </form>

            <AnimatePresence>
                {showResults && results.length > 0 && (
                    <motion.div
                        className="search-results-glass glass-panel"
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={spring}
                    >
                        {results.slice(0, 5).map((result, index) => (
                            <div
                                key={index}
                                className="search-result-item"
                                onClick={() => {
                                    onResult({
                                        center: [parseFloat(result.lon), parseFloat(result.lat)],
                                        zoom: 12,
                                        bbox: result.boundingbox ? [
                                            parseFloat(result.boundingbox[2]), // minLon
                                            parseFloat(result.boundingbox[0]), // minLat
                                            parseFloat(result.boundingbox[3]), // maxLon
                                            parseFloat(result.boundingbox[1])  // maxLat
                                        ] : undefined
                                    });
                                    setShowResults(false);
                                    setQuery('');
                                }}
                            >
                                {result.display_name}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchControl;

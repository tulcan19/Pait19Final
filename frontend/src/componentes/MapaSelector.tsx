import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon not showing
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapaSelectorProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

const LocationMarker = ({
    onLocationSelect,
    position,
    setPosition,
}: {
    onLocationSelect: (lat: number, lng: number) => void;
    position: { lat: number; lng: number } | null;
    setPosition: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>;
}) => {
    const map = useMap();

    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const MapaSelector: React.FC<MapaSelectorProps> = ({ onLocationSelect, initialLat, initialLng }) => {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition({ lat: initialLat, lng: initialLng });
        }
    }, [initialLat, initialLng]);

    // Debounce search for suggestions
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length > 2) {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                    const data = await response.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Error fetching suggestions:", error);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const searchNominatim = async (q: string) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
            return await response.json();
        } catch (e) {
            console.error("Nominatim error:", e);
            return [];
        }
    };

    const handleSearch = async () => {
        if (!query) return;

        setSearching(true);
        setShowSuggestions(false);
        try {
            // Strategy 1: Exact search
            let results = await searchNominatim(query);

            // Strategy 2: Remove specific Quito-style house numbers (e.g., "e1-44") and "y"
            if (!results || results.length === 0) {
                // Regex to remove "e1-44", "N44-22", etc. and standalone "y"
                const cleaned = query
                    .replace(/\s+[a-z]?\d+[-]\d+\s+/gi, ' ') // Remove "e1-44 "
                    .replace(/\s+y\s+/gi, ' ') // Remove " y "
                    .replace(/\s+\d{6}/, ''); // Remove postal code like 170124

                if (cleaned !== query) {
                    console.log("Retrying with cleaned query:", cleaned);
                    results = await searchNominatim(cleaned);
                }
            }

            // Strategy 3: Split by comma and try "Street, City"
            if ((!results || results.length === 0) && query.includes(',')) {
                const parts = query.split(',').map(p => p.trim());
                if (parts.length >= 2) {
                    // Try just the first part (Street) and last part (City/Country)
                    // If address is "Av. El Inca, Quito 170124", parts[0]="Av. El Inca", parts[1]="Quito 170124"

                    // Clean the second part of numbers (postal codes)
                    const cityClean = parts[parts.length - 1].replace(/\d+/g, '').trim();
                    const streetClean = parts[0];

                    const retryQuery = `${streetClean}, ${cityClean}`;
                    console.log("Retrying with simplified query:", retryQuery);
                    results = await searchNominatim(retryQuery);

                    // Strategy 4: If that fails, try just the Street
                    if (!results || results.length === 0) {
                        console.log("Retrying with just street:", streetClean);
                        results = await searchNominatim(streetClean);
                    }
                }
            }

            if (results && results.length > 0) {
                selectLocation(results[0]);
            } else {
                alert("No se encontraron resultados. Intenta buscar solo por la calla principal o la ciudad.");
            }
        } catch (error) {
            console.error("Error buscando ubicación:", error);
            alert("Error al buscar la ubicación.");
        } finally {
            setSearching(false);
        }
    };

    const selectLocation = (location: any) => {
        const { lat, lon, display_name } = location;
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        const newPos = { lat: newLat, lng: newLng };

        setPosition(newPos);
        onLocationSelect(newLat, newLng);
        setQuery(display_name);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    }

    return (
        <div style={{ marginBottom: "1rem" }}>
            <div style={{ marginBottom: "10px", position: "relative" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar dirección, ciudad..."
                        style={{
                            flex: 1,
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                        }}
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                        onBlur={() => {
                            setTimeout(() => setShowSuggestions(false), 200);
                        }}
                    />
                    <button
                        type="button"
                        className="btn-secundario"
                        onClick={handleSearch}
                        disabled={searching}
                        style={{ padding: "8px 16px" }}
                    >
                        {searching ? "Buscando..." : "Buscar"}
                    </button>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <ul style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 1000,
                        marginTop: "4px",
                        padding: 0,
                        listStyle: "none",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}>
                        {suggestions.map((item, index) => (
                            <li
                                key={index}
                                onClick={() => selectLocation(item)}
                                style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderBottom: index < suggestions.length - 1 ? "1px solid #eee" : "none",
                                    fontSize: "14px",
                                    color: "#333"
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                            >
                                {item.display_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{ height: "300px", width: "100%" }}>
                <MapContainer
                    center={[-12.0464, -77.0428]} // Default to Lima, Peru or generic location
                    zoom={13}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker onLocationSelect={onLocationSelect} position={position} setPosition={setPosition} />
                </MapContainer>
            </div>
        </div>
    );
};

export default MapaSelector;

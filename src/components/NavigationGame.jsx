import React, { useEffect, useState, useRef } from 'react';
import Fuse from 'fuse.js';
import PropTypes from 'prop-types';
import { 
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableStreet = ({ street, index, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id: street });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <div className="flex items-center flex-shrink-0">
            <div 
                ref={setNodeRef} 
                style={style} 
                {...attributes} 
                {...listeners}
                className="flex items-center"
            >
                <div className="text-base-content opacity-50 mx-1 flex-shrink-0">→</div>
                <div className="badge bg-primary/20 text-primary border-primary flex gap-2 max-w-[200px] overflow-hidden">
                    <span className="truncate">{street}</span>
                </div>
            </div>
            <button
                onClick={() => onRemove(index)}
                className="ml-1 hover:text-error flex-shrink-0"
                type="button"
            >
                ×
            </button>
        </div>
    );
};

const NavigationGame = ({
    streets,
    setStreetsToDraw,
    setMarkers,
    setPathData,
    setViewState,
    userRef
}) => {
    const [startStreet, setStartStreet] = useState(null);
    const [endStreet, setEndStreet] = useState(null);
    const [route, setRoute] = useState(null);
    const [searchInput, setSearchInput] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStreets, setSelectedStreets] = useState([]);
    const [isCorrect, setIsCorrect] = useState(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [feedback, setFeedback] = useState("");
    const inputRef = useRef(null);
    const fuseRef = useRef(null);
    const loadingRef = useRef(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Initialize Fuse.js
    useEffect(() => {
        if (streets && Object.keys(streets).length > 0) {
            const options = {
                includeScore: true,
                threshold: 0.4,
                keys: ['0.name']
            };
            fuseRef.current = new Fuse(Object.values(streets), options);
        }
    }, [streets]);

    useEffect(() => {
        if (streets && Object.keys(streets).length > 0) {
            setIsLoading(true);
            generateNewChallenge();
        }
    }, [streets]);

    // Update map markers
    useEffect(() => {
        if (startStreet && endStreet) {
            try {
                const startPosition = startStreet[0].path[0];
                const endPosition = endStreet[0].path[endStreet[0].path.length - 1];

                const markers = [
                    {
                        position: startPosition,
                        color: [46, 204, 113], // jasnozielony
                        size: 15,
                        border: [39, 174, 96] // ciemniejszy zielony na border
                    },
                    {
                        position: endPosition,
                        color: [231, 76, 60], // czerwony
                        size: 15,
                        border: [192, 57, 43] // ciemniejszy czerwony na border
                    }
                ];

                setMarkers(markers);
            } catch (error) {
                console.error('Error setting markers:', error);
                setMarkers([]);
            }
        } else {
            setMarkers([]);
        }
    }, [startStreet, endStreet]);

    // Dodaj obsługę wyświetlania wybranych ulic
    useEffect(() => {
        if (!startStreet || !endStreet || !streets) return;

        try {
            const pathsToShow = [];

            // Dodaj wszystkie segmenty ulicy startowej
            startStreet.forEach(segment => {
                pathsToShow.push({
                    path: segment.path,
                    color: [46, 204, 113], // zielony
                    width: 4
                });
            });

            // Dodaj wszystkie segmenty ulicy końcowej
            endStreet.forEach(segment => {
                pathsToShow.push({
                    path: segment.path,
                    color: [231, 76, 60], // czerwony
                    width: 4
                });
            });

            // Dodaj wszystkie segmenty wybranych ulic
            for (const streetName of selectedStreets) {
                // Znajdź wszystkie segmenty dla danej ulicy
                const streetSegments = Object.values(streets).flat().filter(
                    segment => segment.name.toLowerCase() === streetName.toLowerCase()
                );

                if (streetSegments.length > 0) {
                    streetSegments.forEach(segment => {
                        pathsToShow.push({
                            path: segment.path,
                            color: [52, 152, 219], // niebieski
                            width: 4
                        });
                    });
                }
            }

            console.log('Paths to show:', pathsToShow);
            setPathData(pathsToShow);
        } catch (error) {
            console.error('Error setting path data:', error);
            setPathData([]);
        }
    }, [startStreet, endStreet, selectedStreets, streets]);

    // Handle search input
    const handleSearch = (value) => {
        setSearchInput(value);
        if (!value.trim() || !fuseRef.current) {
            setSearchResults([]);
            return;
        }
        const results = fuseRef.current.search(value)
            .filter(result => !selectedStreets.includes(result.item[0].name.toLowerCase()))
            .slice(0, 5);
        setSearchResults(results);
    };

    // Handle street selection
    const handleStreetSelect = (street) => {
        if (!street) return;

        const streetName = street[0].name.toLowerCase();
        if (selectedStreets.includes(streetName)) {
            return;
        }

        const newSelectedStreets = [...selectedStreets, streetName];
        setSelectedStreets(newSelectedStreets);
        setSearchInput("");
        setSearchResults([]);

        // Aktualizacja ścieżek na mapie zostanie obsłużona przez useEffect powyżej
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && searchResults.length > 0) {
            e.preventDefault();
            handleStreetSelect(searchResults[0].item);
        }
    };

    // Add function to remove a street from the selected streets
    const handleRemoveStreet = (indexToRemove) => {
        const newSelectedStreets = selectedStreets.filter((_, index) => index !== indexToRemove);
        setSelectedStreets(newSelectedStreets);

        // Update streets to draw on the map
        const streetsToDraw = [
            startStreet[0].name.toLowerCase(),
            ...newSelectedStreets
        ];
        setStreetsToDraw(streetsToDraw);
    };

    const checkAnswer = () => {
        if (!startStreet || !endStreet || selectedStreets.length === 0) {
            setFeedback("Please select at least one street");
            return;
        }

        // Sprawdź czy wybrane ulice tworzą spójną trasę
        let isValidPath = true;
        let currentStreet = startStreet;

        // Sprawdź połączenia między kolejnymi ulicami
        for (const streetName of selectedStreets) {
            const nextStreetSegments = Object.values(streets).flat().filter(
                s => s.name.toLowerCase() === streetName.toLowerCase()
            );

            if (nextStreetSegments.length === 0) {
                isValidPath = false;
                break;
            }

            // Sprawdź czy ulice są połączone
            if (!areStreetsConnected(currentStreet, nextStreetSegments, streets)) {
                isValidPath = false;
                break;
            }

            currentStreet = nextStreetSegments;
        }

        // Sprawdź połączenie z ulicą końcową
        if (!areStreetsConnected(currentStreet, endStreet, streets)) {
            isValidPath = false;
        }

        if (isValidPath) {
            setScore(score + 1);
            setStreak(streak + 1);
            setFeedback("Correct! You found a valid route!");
            setIsCorrect(true);

            // Pokaż całą trasę
            setStreetsToDraw([
                startStreet[0].name.toLowerCase(),
                ...selectedStreets,
                endStreet[0].name.toLowerCase()
            ]);

            // Generuj nowe wyzwanie po krótkim opóźnieniu
            setTimeout(() => {
                setIsLoading(true);
                generateNewChallenge();
            }, 2000);
        } else {
            setStreak(0);
            setFeedback("This route is not valid. Streets must be connected!");
            setIsCorrect(false);
        }
    };

    // Funkcja do animacji loadera
    const animateLoader = () => {
        loadingRef.current = requestAnimationFrame(animateLoader);
    };

    // Funkcja do zatrzymania animacji
    const stopLoader = () => {
        if (loadingRef.current) {
            cancelAnimationFrame(loadingRef.current);
        }
    };

    const generateNewChallenge = async () => {
        console.log('Starting generation...');
        setIsGenerating(true);
        setIsLoading(true);
        
        try {
            // Dodaj małe opóźnienie, aby upewnić się, że stan się zaktualizował
            await new Promise(resolve => setTimeout(resolve, 100));

            // Najpierw znajdź odpowiednie ulice
            const streetEntries = Object.entries(streets);
            const startIndex = Math.floor(Math.random() * streetEntries.length);
            const start = streetEntries[startIndex][1];

            // Stwórz tablicę indeksów do losowego przeszukiwania
            const indices = Array.from({ length: streetEntries.length }, (_, i) => i)
                .filter(i => i !== startIndex); // Usuń indeks ulicy startowej
            
            let end = null;
            let attempts = 0;
            const maxAttempts = 10;

            // Losowo przemieszaj indeksy
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }

            // Szukaj odpowiedniej pary ulic
            for (const index of indices) {
                if (attempts >= maxAttempts) break;
                attempts++;

                const potentialEnd = streetEntries[index][1];
                
                // Szybkie sprawdzenie nazwy przed kosztownymi obliczeniami
                if (potentialEnd[0].name === start[0].name) continue;

                console.log(`Attempt ${attempts}: Checking ${start[0].name} -> ${potentialEnd[0].name}`);
                
                // Najpierw sprawdź czy istnieje trasa (mniej kosztowne)
                const hasRoute = isRouteExists(start, potentialEnd, Object.values(streets));
                if (!hasRoute) continue;

                // Potem sprawdź czy nie są bezpośrednio połączone (bardziej kosztowne)
                const isDirectlyConnected = areStreetsConnected(start, potentialEnd, streets);
                if (!isDirectlyConnected) {
                    end = potentialEnd;
                    break;
                }

                // Małe opóźnienie między próbami, aby nie blokować UI
                if (attempts % 2 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }

            if (!end) {
                console.log('Failed to find valid pair');
                setIsGenerating(false);
                setIsLoading(false);
                return;
            }

            console.log('Found valid pair, setting up new challenge...');

            // Czyść stany i ustaw nowe wartości w jednej partii
            const updates = () => {
                setSelectedStreets([]);
                setSearchInput("");
                setSearchResults([]);
                setIsCorrect(null);
                setFeedback("");
                setShowHint(false);
                setPathData([]);
                setMarkers([]);
                setStartStreet(start);
                setEndStreet(end);
                setStreetsToDraw([start[0].name.toLowerCase()]);
            };
            updates();

            // Oblicz centrum widoku
            const centerLat = (start[0].path[0][1] + end[0].path[0][1]) / 2;
            const centerLng = (start[0].path[0][0] + end[0].path[0][0]) / 2;

            setViewState(prev => ({
                ...prev,
                latitude: centerLat,
                longitude: centerLng,
                zoom: 14,
                transitionDuration: 1000
            }));

            // Poczekaj na zakończenie animacji
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Generation complete');
            setIsGenerating(false);
            setIsLoading(false);

        } catch (error) {
            console.error('Error generating challenge:', error);
            setIsGenerating(false);
            setIsLoading(false);
        }
    };

    // Dodaj tę funkcję przed isRouteExists
    const findNearbyStreets = (street, allStreets) => {
        if (!street || !allStreets) return [];

        console.log(`Finding nearby streets for ${street[0].name}`);

        return allStreets.filter(otherStreet => {
            // Nie sprawdzaj połączenia z tą samą ulicą
            if (otherStreet[0].name === street[0].name) return false;

            const isConnected = areStreetsConnected(street, otherStreet);

            if (isConnected) {
                console.log(`Found connection: ${street[0].name} -> ${otherStreet[0].name}`);
            }

            return isConnected;
        });
    };

    // Funkcja sprawdzająca czy istnieje jakakolwiek trasa
    const isRouteExists = (start, end, allStreets, maxDepth = 5) => {
        const visited = new Set();

        const dfs = (current, depth = 0) => {
            if (depth > maxDepth) return false;

            const currentName = current[0].name.toLowerCase();
            if (currentName === end[0].name.toLowerCase()) return true;

            visited.add(currentName);

            const neighbors = findNearbyStreets(current, allStreets);
            for (const neighbor of neighbors) {
                const neighborName = neighbor[0].name.toLowerCase();
                if (!visited.has(neighborName)) {
                    if (dfs(neighbor, depth + 1)) return true;
                }
            }

            return false;
        };

        return dfs(start);
    };

    const getHint = () => {
        if (!route || route.length < 2) return;

        // If no answer yet, show the first intermediate street
        if (!selectedStreets.length) {
            setFeedback(`Hint: The first street after ${startStreet[0].name} is ${route[1]}`);
        } else {
            // Find the next street in the route after the last correct street
            const lastCorrectIndex = selectedStreets.reduce((acc, street, index) => {
                return street === route[index] ? index : acc;
            }, -1);

            if (lastCorrectIndex >= 0 && lastCorrectIndex < route.length - 1) {
                setFeedback(`Hint: After ${route[lastCorrectIndex]}, try ${route[lastCorrectIndex + 1]}`);
            }
        }
        setShowHint(true);
    };

    // Helper function to calculate distance between two points
    const calculateDistance = (point1, point2) => {
        const [lat1, lon1] = point1;
        const [lat2, lon2] = point2;
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    // Check if two line segments intersect
    const doSegmentsIntersect = (p1, p2, p3, p4) => {
        const ccw = (A, B, C) => {
            return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
        };
        return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    };

    // Check if two streets are connected
    const areStreetsConnected = (street1, street2) => {
        // Sprawdź wszystkie segmenty obu ulic
        for (const segment1 of street1) {
            const path1 = segment1.path;

            for (const segment2 of street2) {
                const path2 = segment2.path;

                // Sprawdź każdy punkt pierwszej ulicy z każdym punktem drugiej
                for (let i = 0; i < path1.length; i++) {
                    for (let j = 0; j < path2.length; j++) {
                        const distance = calculateDistance(path1[i], path2[j]);

                        // Jeśli znaleziono punkty bliżej niż 50m
                        if (distance < 50) {
                            return true;
                        }
                    }
                }

                // Sprawdź czy ulice mają wspólny punkt
                for (const point1 of path1) {
                    for (const point2 of path2) {
                        const distance = calculateDistance(point1, point2);
                        if (distance < 50) { // 50 metrów tolerancji
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };

    // Generate a route between start and end streets
    const generateRoute = (start, end, allStreets) => {
        console.log('Generating route from', start[0].name, 'to', end[0].name);

        let attempts = 0;
        const maxAttempts = 10;
        let bestRoute = null;

        while (attempts < maxAttempts) {
            attempts++;
            const route = [start];
            let current = start;

            // Try to find 1-3 intermediate streets
            const targetIntermediates = Math.floor(Math.random() * 3) + 1;

            for (let step = 0; step < targetIntermediates; step++) {
                const nearby = findNearbyStreets(current, allStreets)
                    .filter(street => !route.includes(street) && street !== end);

                console.log(`Step ${step + 1}: Found ${nearby.length} nearby streets for ${current[0].name}`);
                if (nearby.length > 0) {
                    console.log('Options:', nearby.map(s => s[0].name).join(', '));
                }

                if (nearby.length === 0) break;

                const next = nearby[Math.floor(Math.random() * nearby.length)];
                console.log(`Selected: ${next[0].name}`);
                route.push(next);
                current = next;
            }

            const lastStreet = route[route.length - 1];
            const canReachEnd = findNearbyStreets(lastStreet, [end]).length > 0;
            console.log(`Can reach end from ${lastStreet[0].name}: ${canReachEnd}`);

            if (canReachEnd) {
                route.push(end);
                console.log(`Found route: ${route.map(s => s[0].name).join(' -> ')}`);
                if (!bestRoute || route.length >= bestRoute.length) {
                    bestRoute = route;
                }
                if (route.length === targetIntermediates + 2) break;
            }
        }

        return bestRoute;
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        
        if (active.id !== over.id) {
            setSelectedStreets((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Cleanup przy odmontowaniu komponentu
    useEffect(() => {
        return () => {
            stopLoader();
        };
    }, []);

    return (
        <div className="flex flex-col gap-4 w-full max-w-xl p-4">
            {/* Game header */}
            <div className="flex justify-between items-center bg-base-100 rounded-lg p-4 shadow-lg">
                <div className="flex gap-4">
                    <div className="text-center">
                        <div className="text-sm opacity-60">Score</div>
                        <div className="text-2xl font-bold text-primary">{score}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm opacity-60">Streak</div>
                        <div className="text-2xl font-bold text-secondary">{streak}</div>
                    </div>
                </div>
            </div>

            {/* Challenge section */}
            <div className="bg-base-100 rounded-lg p-4 shadow-lg relative">
                {isGenerating && (
                    <div className="absolute inset-0 bg-base-100/80 flex items-center justify-center rounded-lg z-10">
                        <div className="loading loading-spinner loading-lg text-primary"></div>
                    </div>
                )}

                <h2 className="text-lg font-medium mb-4">
                    Navigate from{" "}
                    <span className="text-success font-bold">{startStreet && startStreet[0].name}</span>
                    {" "}to{" "}
                    <span className="text-error font-bold">{endStreet && endStreet[0].name}</span>
                </h2>

                {/* Route display */}
                <div className="mb-4">
                    <div className="text-sm opacity-60 mb-2">Your route:</div>
                    <div className="flex items-center flex-wrap gap-y-2">
                        <div className="badge bg-success/20 text-success border-success max-w-[200px] overflow-hidden">
                            <span className="truncate">
                                {startStreet && startStreet[0].name}
                            </span>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={selectedStreets}
                                strategy={horizontalListSortingStrategy}
                            >
                                {selectedStreets.map((street, index) => (
                                    <SortableStreet
                                        key={street}
                                        street={street}
                                        index={index}
                                        onRemove={handleRemoveStreet}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {selectedStreets.length > 0 && (
                            <>
                                <div className="text-base-content opacity-50 mx-1 flex-shrink-0">→</div>
                                <div className="badge bg-error/20 text-error border-error max-w-[200px] overflow-hidden">
                                    <span className="truncate">
                                        {endStreet && endStreet[0].name}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Search input */}
                <div className="form-control">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type a street name..."
                            className="input input-bordered w-full pr-10"
                            value={searchInput}
                            onChange={(e) => handleSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        {searchInput && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                                onClick={() => {
                                    setSearchInput("");
                                    setSearchResults([]);
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Search results */}
                {searchResults.length > 0 && (
                    <div className="mt-2 bg-base-200 rounded-lg overflow-hidden">
                        {searchResults.map((result, index) => (
                            <button
                                key={index}
                                className="w-full px-4 py-2 text-left hover:bg-base-300 flex justify-between items-center"
                                onClick={() => handleStreetSelect(result.item)}
                            >
                                <span>{result.item[0].name}</span>
                                <span className="text-xs opacity-60">
                                    {Math.round((1 - result.score) * 100)}% match
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Feedback */}
                {feedback && (
                    <div className={`mt-4 p-3 rounded-lg ${isCorrect === true ? 'bg-success/20 text-success' :
                        isCorrect === false ? 'bg-error/20 text-error' :
                            'bg-info/20 text-info'
                        }`}>
                        {feedback}
                    </div>
                )}

                {/* Controls */}
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={getHint}
                        disabled={!route || showHint || isGenerating}
                    >
                        Get Hint
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => checkAnswer()}
                        disabled={selectedStreets.length === 0 || isGenerating}
                    >
                        Check Route
                    </button>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={generateNewChallenge}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                            'New Challenge'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

NavigationGame.propTypes = {
    streets: PropTypes.object.isRequired,
    setStreetsToDraw: PropTypes.func.isRequired,
    setMarkers: PropTypes.func.isRequired,
    setPathData: PropTypes.func.isRequired,
    setViewState: PropTypes.func.isRequired,
    userRef: PropTypes.object
};

export default NavigationGame;

function calculateDistance(point1, point2) {
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

    return R * c;
}

function areStreetsConnected(street1, street2) {
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
}

function isRouteExists(start, end, allStreets, maxDepth = 5) {
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
}

function findNearbyStreets(street, allStreets) {
    if (!street || !allStreets) return [];
    return allStreets.filter(otherStreet => {
        if (otherStreet[0].name === street[0].name) return false;
        return areStreetsConnected(street, otherStreet);
    });
}

function findOptimalRoute(start, end, allStreets) {
    const queue = [[start]];
    const visited = new Set([start[0].name.toLowerCase()]);
    let shortestRoute = null;
    let shortestLength = Infinity;
    
    while (queue.length > 0) {
        const currentPath = queue.shift();
        const currentStreet = currentPath[currentPath.length - 1];
        
        if (currentPath.length > 5) continue;

        if (currentStreet[0].name.toLowerCase() === end[0].name.toLowerCase()) {
            // Sprawdź, czy cała trasa jest połączona
            let isValidRoute = true;
            for (let i = 0; i < currentPath.length - 1; i++) {
                if (!areStreetsConnected(currentPath[i], currentPath[i + 1])) {
                    isValidRoute = false;
                    break;
                }
            }

            if (!isValidRoute) continue;

            // Oblicz długość trasy
            let routeLength = 0;
            for (let i = 0; i < currentPath.length - 1; i++) {
                const point1 = currentPath[i][0].path[currentPath[i][0].path.length - 1];
                const point2 = currentPath[i + 1][0].path[0];
                routeLength += calculateDistance(point1, point2);
            }
            
            if (routeLength < shortestLength) {
                shortestLength = routeLength;
                shortestRoute = currentPath;
            }
            continue;
        }

        // Znajdź połączone ulice
        const neighbors = Object.values(allStreets)
            .filter(street => {
                const streetName = street[0].name.toLowerCase();
                return !visited.has(streetName) && areStreetsConnected(currentStreet, street);
            });

        for (const neighbor of neighbors) {
            const neighborName = neighbor[0].name.toLowerCase();
            if (!visited.has(neighborName)) {
                visited.add(neighborName);
                queue.push([...currentPath, neighbor]);
            }
        }
    }
    
    return { route: shortestRoute, length: shortestLength };
}

self.onmessage = function(e) {
    const { start, end, streets, selectedStreets } = e.data;
    
    try {
        console.log('Worker received data:');
        console.log('Selected streets:', selectedStreets);
        console.log('Available streets:', Object.keys(streets));
        
        // Funkcja pomocnicza do normalizacji nazw ulic
        const normalizeStreetName = (name) => {
            return name.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // usuń znaki diakrytyczne
                .replace(/[^a-z0-9\s]/g, "") // usuń znaki specjalne
                .trim();
        };

        // Stwórz znormalizowany indeks ulic
        const normalizedStreets = {};
        Object.entries(streets).forEach(([key, value]) => {
            const normalized = normalizeStreetName(key);
            normalizedStreets[normalized] = value;
        });

        // Najpierw sprawdź, czy wybrana trasa jest poprawna
        let isValidUserRoute = true;
        const userPath = selectedStreets.map(name => {
            const normalized = normalizeStreetName(name);
            const street = normalizedStreets[normalized];
            return street;
        });

        // Dodaj ulicę startową i końcową do trasy użytkownika
        const fullUserPath = [start, ...userPath, end];
        
        // Sprawdź połączenia w trasy użytkownika
        for (let i = 0; i < fullUserPath.length - 1; i++) {
            const street1 = fullUserPath[i];
            const street2 = fullUserPath[i + 1];
            console.log(`Checking connection between:`, street1[0].name, 'and', street2[0].name);
            
            const isConnected = areStreetsConnected(street1, street2);
            console.log(`Connection result:`, isConnected);
            
            if (!isConnected) {
                isValidUserRoute = false;
                console.log(`Invalid connection found between ${street1[0].name} and ${street2[0].name}`);
                break;
            }
        }

        if (!isValidUserRoute) {
            self.postMessage({ 
                success: false,
                error: "Selected streets are not connected"
            });
            return;
        }

        // Oblicz długość pełnej trasy użytkownika
        let userRouteLength = 0;
        for (let i = 0; i < fullUserPath.length - 1; i++) {
            const point1 = fullUserPath[i][0].path[fullUserPath[i][0].path.length - 1];
            const point2 = fullUserPath[i + 1][0].path[0];
            userRouteLength += calculateDistance(point1, point2);
        }

        // Znajdź optymalną trasę
        const { route, length: optimalLength } = findOptimalRoute(start, end, streets);
        
        if (route) {
            self.postMessage({ 
                success: true, 
                route: route.map(street => street[0].name),
                stats: {
                    userRouteLength: Math.round(userRouteLength),
                    optimalRouteLength: Math.round(optimalLength),
                    userStreetCount: fullUserPath.length,
                    optimalStreetCount: route.length,
                    lengthDifference: Math.round(userRouteLength - optimalLength),
                    lengthRatio: Math.round((userRouteLength / optimalLength) * 100)
                },
                userRoute: [start[0].name, ...selectedStreets, end[0].name]
            });
        } else {
            self.postMessage({ 
                success: false,
                error: "No valid route found"
            });
        }
    } catch (error) {
        console.error('Error in worker:', error);
        self.postMessage({ 
            success: false, 
            error: error.message 
        });
    }
}; 
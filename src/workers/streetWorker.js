// Funkcje pomocnicze
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

    return R * c;
};

const areStreetsConnected = (street1, street2) => {
    for (const segment1 of street1) {
        const path1 = segment1.path;

        for (const segment2 of street2) {
            const path2 = segment2.path;

            for (let i = 0; i < path1.length; i++) {
                for (let j = 0; j < path2.length; j++) {
                    const distance = calculateDistance(path1[i], path2[j]);
                    if (distance < 50) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
};

const findNearbyStreets = (street, allStreets) => {
    if (!street || !allStreets) return [];
    return allStreets.filter(otherStreet => {
        if (otherStreet[0].name === street[0].name) return false;
        return areStreetsConnected(street, otherStreet);
    });
};

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

// Uproszczona funkcja do znajdowania trasy
function findRouteWithLength(start, end, allStreets) {
    const queue = [[start]];
    const visited = new Set([start[0].name.toLowerCase()]);
    const maxDepth = 5; // Stała maksymalna długość trasy
    
    while (queue.length > 0) {
        const currentPath = queue.shift();
        const currentStreet = currentPath[currentPath.length - 1];
        
        // Jeśli ścieżka jest za długa, pomijamy
        if (currentPath.length > maxDepth) continue;

        // Jeśli znaleźliśmy cel i trasa nie jest bezpośrednia
        if (currentStreet[0].name.toLowerCase() === end[0].name.toLowerCase()) {
            if (currentPath.length > 2) { // Więcej niż start i koniec
                return currentPath;
            }
            continue;
        }

        // Znajdź sąsiadów
        const neighbors = findNearbyStreets(currentStreet, allStreets)
            .filter(neighbor => !visited.has(neighbor[0].name.toLowerCase()));

        // Losowo przemieszaj sąsiadów
        for (let i = neighbors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
        }

        for (const neighbor of neighbors) {
            const neighborName = neighbor[0].name.toLowerCase();
            if (!visited.has(neighborName)) {
                visited.add(neighborName);
                queue.push([...currentPath, neighbor]);
            }
        }
    }
    
    return null;
}

// Główna funkcja workera
self.onmessage = function(e) {
    const { start, streets } = e.data;
    
    try {
        const streetEntries = Object.entries(streets);
        const indices = Array.from({ length: streetEntries.length }, (_, i) => i)
            .filter(i => streetEntries[i][1][0].name !== start[0].name);
        
        let result = null;
        let attempts = 0;

        while (!result) {
            // Przemieszaj indeksy
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }

            for (const index of indices) {
                attempts++;
                const potentialEnd = streetEntries[index][1];
                
                // Szybkie sprawdzenie odległości
                const startPoint = start[0].path[0];
                const endPoint = potentialEnd[0].path[0];
                const directDistance = calculateDistance(startPoint, endPoint);
                
                if (directDistance < 100 || directDistance > 1000) continue;

                const route = findRouteWithLength(start, potentialEnd, Object.values(streets));
                
                if (route) {
                    result = potentialEnd;
                    break;
                }

                if (attempts % 50 === 0) {
                    self.postMessage({
                        type: 'progress',
                        attempts
                    });
                }
            }
        }

        self.postMessage({ 
            success: true, 
            result,
            attempts
        });
    } catch (error) {
        self.postMessage({ 
            success: false, 
            error: error.message 
        });
    }
}; 
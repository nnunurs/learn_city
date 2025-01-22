import { useEffect, useState } from "react";
import { FlyToInterpolator } from "deck.gl";
import { PathLayer, PolygonLayer } from "@deck.gl/layers";
import krakowStreets from "../data/krakow_divisions.json";
import krakowDivisions from "../data/krakow_divisions_filtered.json";
import zakopaneStreets from "../data/zakopane_streets.json";
import {
    findIndexByName,
    weightedRandom,
} from "../scripts/scripts";
import changelog from "../changelog.json";
import { Changelog } from "./Changelog";
import MapComponent from "./MapComponent";
import ControlPanel from "./ControlPanel";
import NavigationGame from "./NavigationGame";
import ErrorBoundary from "./ErrorBoundary";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";

const center = {
    krakow: [50.06168144356519, 19.937328289497746],
    zakopane: [49.29389943354241, 19.95370589727813],
};

function MapGuess() {
    const [viewState, setViewState] = useState({
        longitude: 19.937328289497746,
        latitude: 50.06168144356519,
        zoom: 10.5,
        pitch: 0,
        bearing: 0
    });
    const [resetKey, setResetKey] = useState(0);
    const [streets, setStreets] = useState(null);
    const [streetsToDraw, setStreetsToDraw] = useState([]);
    const [currentStreet, setCurrentStreet] = useState([{ name: "loading", path: [[0, 0]] }]);
    const [city, setCity] = useState("krakow");
    const [division, setDivision] = useState("stare_miasto");
    const [isDivisionsView, setIsDivisionsView] = useState(false);
    const [layers, setLayers] = useState([]);
    const [hovered, setHovered] = useState(null);
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState("");
    const [userRef, setUserRef] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [pathData, setPathData] = useState([]);
    const [gameMode, setGameMode] = useState('quiz');
    const [optimalPathData, setOptimalPathData] = useState([]);
    const [quizPathData, setQuizPathData] = useState([]);
    const [divisionsData, setDivisionsData] = useState([]);
    const [navigationRef, setNavigationRef] = useState(null);

    // Nasłuchuj na zmiany stanu autoryzacji
    useEffect(() => {
        console.log("Setting up auth listener");
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed:", user?.uid);
            if (user) {
                // Pobierz dokument użytkownika
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    console.log("Setting userRef to document ID:", userDoc.id);
                    setUserRef(userDoc.id);
                    // Jeśli użytkownik jest zalogowany, ale nie ma wybranej dzielnicy, pokaż wybór dzielnicy
                    if (!division || division === "stare_miasto") {
                        enableDivisionsView();
                    }
                }
            } else {
                console.log("Clearing userRef");
                setUserRef(null);
                setStreetsToDraw([]);
            }
        });

        // Sprawdź aktualny stan przy montowaniu
        const checkCurrentUser = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    console.log("Initial auth state - setting userRef to:", userDoc.id);
                    setUserRef(userDoc.id);
                    if (!division || division === "stare_miasto") {
                        enableDivisionsView();
                    }
                }
            }
        };
        checkCurrentUser();

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        console.log("userRef changed:", userRef);
        if (userRef) {
            console.log("Starting up with userRef:", userRef);
            // Opóźnij wywołanie onStartup aby dać czas na załadowanie innych komponentów
            setTimeout(() => {
                onStartup();
            }, 100);
        } else {
            console.log("Clearing streetsToDraw due to no userRef");
            setStreetsToDraw([]);
            setCurrentStreet([{ name: "loading", path: [[0, 0]] }]);
        }
    }, [userRef]);

    useEffect(() => {
        console.log("streetsToDraw changed:", streetsToDraw.length);
    }, [streetsToDraw]);

    const onStartup = () => {
        enableDivisionsView();
    };

    const getRandomStreet = () => {
        if (!streets || Object.keys(streets).length === 0) {
            console.warn("No streets available to select from.");
            return;
        }

        if (!userRef) {
            console.warn("No userRef available, cannot select random street.");
            return;
        }

        let availableStreets = Object.keys(streets).filter(
            streetKey => !currentStreet || streetKey !== currentStreet[0]?.name
        );

        if (availableStreets.length === 0) {
            console.log("No available streets, resetting filter");
            availableStreets = Object.keys(streets);
        }

        console.log("Selecting from", availableStreets.length, "available streets");

        const random_street_key = weightedRandom(availableStreets, [
            ...availableStreets.map((e) => {
                if (streetsToDraw.map((e) => e.name).includes(e)) {
                    switch (
                    streetsToDraw[findIndexByName(streetsToDraw, e)].color
                    ) {
                        case "darkgreen":
                            return 0.05;
                        case "green":
                            return 0.3;
                        case "red":
                            return 0.8;
                        case "yellow":
                            return 0.4;
                        default:
                            return 1.5;
                    }
                } else {
                    return 1;
                }
            }),
        ]).item;

        const newStreet = streets[random_street_key];
        console.log("Selected new street:", newStreet[0].name);
        setCurrentStreet(newStreet);

        setQuizPathData([
            ...newStreet.map((e) => ({ ...e, color: "selected" })),
            ...streetsToDraw.map((e) =>
                e.name === newStreet[0].name
                    ? { ...e, color: "selected" }
                    : e,
            ),
        ]);
        focusOnStreet(newStreet);
        setVisible(false);
    };

    useEffect(() => {
        if (!currentStreet) return;

        if (currentStreet[0].name !== "loading") {
            setQuizPathData([
                ...currentStreet.map((e) => ({ ...e, color: "selected" })),
                ...streetsToDraw.map((e) =>
                    e.name === currentStreet[0].name
                        ? { ...e, color: "selected" }
                        : e,
                ),
            ]);
        }
    }, [currentStreet, streetsToDraw]);

    useEffect(() => {
        if (!division || !streets) {
            console.log("Missing division or streets data");
            return;
        }

        const divisionStreets = city === "krakow" ? krakowStreets[division] : zakopaneStreets;
        if (!divisionStreets) {
            console.log("No streets data for division:", division);
            return;
        }

        if (JSON.stringify(streets) !== JSON.stringify(divisionStreets)) {
            console.log("Setting streets for division:", division);
            setStreets(divisionStreets);
            return; // Poczekaj na następny cykl useEffect
        }
        
        if (Object.keys(streets).length > 0 && gameMode === 'quiz' && userRef) {
            console.log("Getting random street for quiz");
            getRandomStreet();
        }
    }, [division, city, streets, resetKey, gameMode, userRef]);

    useEffect(() => {
        if (gameMode === 'navigation') {
            setQuizPathData([]);
            setCurrentStreet([{ name: "loading", path: [[0, 0]] }]);
        } else if (gameMode === 'quiz' && streets && Object.keys(streets).length > 0 && userRef) {
            console.log("Initializing quiz mode");
            getRandomStreet();
        }
    }, [gameMode, streets, userRef]);

    const focusOnStreet = (streetToFocus = currentStreet) => {
        if (!streetToFocus) return;
        console.log(streetToFocus);

        const latitudes = streetToFocus.flatMap(segment => segment.path.map(point => point[1]));
        const longitudes = streetToFocus.flatMap(segment => segment.path.map(point => point[0]));
        
        const centerLatitude = latitudes.reduce((a, b) => a + b) / latitudes.length;
        const centerLongitude = longitudes.reduce((a, b) => a + b) / longitudes.length;

        setViewState({
            longitude: centerLongitude,
            latitude: centerLatitude,
            zoom: 16,
            transitionDuration: 1000,
            transitionInterpolator: new FlyToInterpolator(),
        });
    };

    const handleDivisionHover = (info) => {
        console.log("Hover info:", info);
        if (info) {
            setHovered({ x: info.x, y: info.y });
            setName(info.name);
            setVisible(true);
        } else {
            setVisible(false);
        }
    };

    const handleDivisionClick = (divisionName) => {
        const divisionId = divisionName.toLowerCase().replace(" ", "_");
        clearMap();
        setStreetsToDraw([]);
        setIsDivisionsView(false);
        setDivisionsData([]);
        setStreets(krakowStreets[divisionId]);
        setDivision(divisionId);
        setResetKey(prev => prev + 1);
    };

    const clearMap = () => {
        setMarkers([]);
        setPathData([]);
        setOptimalPathData([]);
        setQuizPathData([]);
        setDivisionsData([]);
    }

    const enableDivisionsView = () => {
        setCity("krakow");
        setIsDivisionsView(true);
        clearMap();
        setDivisionsData(krakowDivisions.features);
        setCurrentStreet([{ name: "loading", path: [[0, 0]] }]);
        setViewState({
            latitude: center.krakow[0],
            longitude: center.krakow[1],
            zoom: 10.5,
            transitionDuration: 800,
            transitionInterpolator: new FlyToInterpolator(),
            minZoom: 10.5,
        });
    };

    const cancelDivisionsView = () => {
        setIsDivisionsView(false);
        clearMap();
        setDivisionsData([]);
        if (gameMode === 'quiz' && streets && Object.keys(streets).length > 0) {
            getRandomStreet();
        } else if (gameMode === 'navigation' && navigationRef) {
            navigationRef.generateNewChallenge();
        } else {
            setViewState(prev => ({
                ...prev,
                latitude: center.krakow[0],
                longitude: center.krakow[1],
                zoom: 14,
                transitionDuration: 800,
                transitionInterpolator: new FlyToInterpolator(),
            }));
        }
    };

    return (
        <div className="relative w-full h-screen">
            <MapComponent
                viewState={viewState}
                setViewState={setViewState}
                layers={layers}
                markers={markers}
                pathData={pathData}
                optimalPathData={optimalPathData}
                quizPathData={quizPathData}
                divisionsData={divisionsData}
                onDivisionHover={handleDivisionHover}
                onDivisionClick={handleDivisionClick}
            />
            {visible && (
                <div
                    className="absolute z-10 pointer-events-none bg-base-100 bg-opacity-90 rounded-lg shadow-lg p-4"
                    style={{
                        left: hovered.x + 15,
                        top: hovered.y + 15,
                    }}
                >
                    <div className="text-md font-medium">{name}</div>
                </div>
            )}
            <ControlPanel
                getRandomStreet={getRandomStreet}
                visible={visible}
                hovered={hovered}
                name={name}
                division={division}
                focusOnStreet={focusOnStreet}
                enableDivisionsView={enableDivisionsView}
                cancelDivisionsView={cancelDivisionsView}
                currentStreet={currentStreet}
                streets={streets}
                userRef={userRef}
                setUserRef={setUserRef}
                streetsToDraw={streetsToDraw}
                setStreetsToDraw={setStreetsToDraw}
                isDivisionsView={isDivisionsView}
                setMarkers={setMarkers}
                setPathData={setPathData}
                setViewState={setViewState}
                gameMode={gameMode}
                setGameMode={setGameMode}
                setOptimalPathData={setOptimalPathData}
                setQuizPathData={setQuizPathData}
                navigationRef={navigationRef}
                setNavigationRef={setNavigationRef}
            />
            {/* <Changelog
                version={changelog.version}
                changes={changelog.changes}
            /> */}
        </div>
    );
}

export default function App() {
    return <MapGuess />;
}

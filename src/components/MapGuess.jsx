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
    const [quizEnabled, setQuizEnabled] = useState(false);
    const [markers, setMarkers] = useState([]);
    const [pathData, setPathData] = useState([]);
    const [gameMode, setGameMode] = useState('quiz');
    const [optimalPathData, setOptimalPathData] = useState([]);
    const [quizPathData, setQuizPathData] = useState([]);
    const [divisionsData, setDivisionsData] = useState([]);


    useEffect(() => {
        if (userRef) {
            onStartup();
        } else {
            setQuizEnabled(false)
            setStreetsToDraw([]);
        }
    }, [userRef]);

    const onStartup = () => {
        enableDivisionsView();
    };

    const getRandomStreet = () => {
        if (!streets || Object.keys(streets).length === 0) {
            console.warn("No streets available to select from.");
            return;
        }

        const random_street_key = weightedRandom(Object.keys(streets), [
            ...Object.keys(streets).map((e) => {
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
        switch (city) {
            case "krakow":
                setDivision("stare_miasto");
                setStreets(krakowStreets["stare_miasto"]);
                break;
            case "zakopane":
                setDivision("zakopane");
                setStreets(zakopaneStreets);
                break;
        }
    }, [city]);

    useEffect(() => {
        console.log(division, streets, city);
        if (!division) return;

        const divisionStreets = city === "krakow" ? krakowStreets[division] : zakopaneStreets;
        if (!divisionStreets) return;

        setStreets(divisionStreets);
        getRandomStreet();
    }, [division, city]);

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
        if (info && info.object) {
            setHovered({ x: info.x, y: info.y });
            setName(info.object.properties.name);
            setVisible(true);
        } else {
            setVisible(false);
        }
    };

    const handleDivisionClick = (divisionName) => {
        const divisionId = divisionName.toLowerCase().replace(" ", "_");
        setQuizEnabled(true);
        setDivision(divisionId);
        setStreetsToDraw([]);
        setIsDivisionsView(false);
        setStreets(krakowStreets[divisionId]);
        setDivisionsData([]);
    };

    const enableDivisionsView = () => {
        setCity("krakow");
        setQuizEnabled(false);
        setDivisionsData(krakowDivisions.features);
        setQuizPathData([]);
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

    const handleEnableDivisionsView = () => {
        setIsDivisionsView(true);
        enableDivisionsView();
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
                    className="absolute z-10 pointer-events-none glass rounded-lg shadow-lg p-4"
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
                enableDivisionsView={handleEnableDivisionsView}
                currentStreet={currentStreet}
                streets={streets}
                userRef={userRef}
                setUserRef={setUserRef}
                quizEnabled={quizEnabled}
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
            />
            <Changelog
                version={changelog.version}
                changes={changelog.changes}
            />
        </div>
    );
}

export default function App() {
    return <MapGuess />;
}

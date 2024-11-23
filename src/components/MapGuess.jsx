import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { FlyToInterpolator } from "deck.gl";
import { PathLayer, PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import krakowStreets from "../data/krakow_divisions.json";
import krakowDivisions from "../data/krakow_divisions_filtered.json";
import zakopaneStreets from "../data/zakopane_streets.json";
import {
    clamp,
    filterObj,
    findIndexByName,
    weightedRandom,
} from "../scripts/scripts";
import changelog from "../changelog.json";
import { Changelog } from "./Changelog";
import MapComponent from "./MapComponent";
import ControlPanel from "./ControlPanel";

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
    const [isDivisionsView, setDivisionsView] = useState(false);
    const [layers, setLayers] = useState([]);
    const [hovered, setHovered] = useState(null);
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState("");
    const [isControllerEnabled, setControllerEnabled] = useState(true);
    const [userRef, setUserRef] = useState(null);
    const [quizEnabled, setQuizEnabled] = useState(false);

    const cleanCookies = () => {
        const new_score = Object.keys(krakowStreets).reduce(
            (o, key) => ({
                ...o,
                [key]: { correct: 0, wrong: 0, known: [], mistakes: [] },
            }),
            {},
        );

        setCookie("score", {
            krakow: new_score,
            zakopane: {
                zakopane: { correct: 0, wrong: 0, known: [], mistakes: [] },
            },
        });
    };

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
        setLayers([
            new PathLayer({
                id: "path-layer",
                data: [
                    ...newStreet.map((e) => ({ ...e, color: "selected" })),
                    ...streetsToDraw.map((e) =>
                        e.name === newStreet[0].name
                            ? { ...e, color: "selected" }
                            : e,
                    ),
                ],
                getWidth: (d) => (d.color === "selected" ? 7 : 4),
                capRounded: true,
                jointRounded: true,
                getColor: (d) => getColor(d.color),
                widthMinPixels: 3,
            }),
        ]);
        focusOnStreet(newStreet);
        setVisible(false);
    };

    useEffect(() => {
        if (!currentStreet) return;

        if (currentStreet[0].name !== "loading") {
            setLayers([
                new PathLayer({
                    id: "path-layer",
                    data: [
                        ...currentStreet.map((e) => ({ ...e, color: "selected" })),
                        ...streetsToDraw.map((e) =>
                            e.name === currentStreet[0].name
                                ? { ...e, color: "selected" }
                                : e,
                        ),
                    ],
                    getWidth: (d) => (d.color === "selected" ? 7 : 4),
                    capRounded: true,
                    jointRounded: true,
                    getColor: (d) => getColor(d.color),
                    widthMinPixels: 3,
                }),
            ]);
        }
    }, [currentStreet, streetsToDraw]);

    useEffect(() => {
        if (layers.length > 0 && layers[0].id === "divisions-layer") {
            setControllerEnabled(false);
        } else {
            setControllerEnabled(true);
        }
    }, [layers]);

    useEffect(() => {
        setControllerEnabled(true);
    }, []);

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

        setViewState({
            longitude: streetToFocus[0].path[0][0],
            latitude: streetToFocus[0].path[0][1],
            zoom: 16,
            transitionDuration: 1000,
            transitionInterpolator: new FlyToInterpolator(),
        });
    };

    const getColor = (color) => {
        switch (color) {
            case "selected":
                return [205, 39, 217];
            case "darkgreen":
                return [51, 114, 120];
            case "green":
                return [64, 160, 115];
            case "red":
                return [214, 60, 69];
            case "yellow":
                return [255, 148, 38];
            default:
                return [79, 100, 255];
        }
    };

    const enableDivisionsView = () => {
        setCity("krakow");
        setQuizEnabled(false);
        setLayers([
            new PolygonLayer({
                id: 'divisions-layer',
                data: krakowDivisions.features,
                pickable: true,
                stroked: true,
                filled: true,
                wireframe: true,
                lineWidthMinPixels: 1,
                getPolygon: d => d.geometry.coordinates[0],
                getLineColor: [80, 80, 80],
                getFillColor: [0, 0, 0, 20],
                onHover: (info) => {
                    if (info.object) {
                        setHovered({ x: info.x, y: info.y });
                        setName(info.object.properties.name);
                        setVisible(true);
                    } else {
                        setVisible(false);
                    }
                },
                onClick: (info) => {
                    console.log(info);
                    if (info.object) {
                        const divisionName = info.object.properties.name;
                        const divisionId = divisionName.toLowerCase().replace(" ", "_");

                        setLayers([]);
                        setQuizEnabled(true);

                        setDivision(divisionId);
                        setStreetsToDraw([]);
                        setDivisionsView(false);
                        setStreets(krakowStreets[divisionId]);
                    }
                }
            })
        ]);
        setViewState({
            latitude: center.krakow[0],
            longitude: center.krakow[1],
            zoom: 10.5,
            transitionDuration: 800,
            transitionInterpolator: new FlyToInterpolator(),
            minZoom: 10.5,
        });
    };

    const handleDivisionViewEnabled = () => {
        setDivisionsView(true);
        enableDivisionsView();
    };

    return (
        <div className="flex h-screen w-screen items-end justify-center sm:items-start sm:justify-end">
            <div className="">
                {visible && hovered && (
                    <div
                        className="glass fixed z-10 rounded-md p-2 text-lg"
                        style={{
                            left: hovered.x + 20,
                            top: hovered.y + 20,
                            pointerEvents: "none",
                        }}
                    >
                        {name}
                    </div>
                )}
                <MapComponent
                    viewState={viewState}
                    setViewState={setViewState}
                    layers={layers}
                    isControllerEnabled={isControllerEnabled}
                />
            </div>
            <ControlPanel
                visible={visible}
                hovered={hovered}
                name={name}
                city={city}
                division={division}
                cleanCookies={cleanCookies}
                getRandomStreet={getRandomStreet}
                focusOnStreet={focusOnStreet}
                currentStreet={currentStreet}
                streets={streets}
                userRef={userRef}
                setUserRef={setUserRef}
                quizEnabled={quizEnabled}
                streetsToDraw={streetsToDraw}
                setStreetsToDraw={setStreetsToDraw}
                setCity={setCity}
                isDivisionsView={isDivisionsView}
                enableDivisionsView={handleDivisionViewEnabled}
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

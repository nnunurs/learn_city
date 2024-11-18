import { useEffect, useContext } from "react";
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
import MapContext, { MapProvider } from "../context/MapContext";

const center = {
    krakow: [50.06168144356519, 19.937328289497746],
    zakopane: [49.29389943354241, 19.95370589727813],
};

function MapGuess() {
    const {
        viewState,
        setViewState,
        hovered,
        setHovered,
        visible,
        setVisible,
        setQuizEnabled,
        radius,
        radiusEnabled,
        setRadiusEnabled,
        name,
        setName,
        city,
        setCity,
        streets,
        setStreets,
        division,
        setDivision,
        streetsToDraw,
        currentStreet,
        setCurrentStreet,
        layers,
        setLayers,
        setControllerEnabled,
        enableDivisionsView,
    } = useContext(MapContext);

    const [cookies, setCookie] = useCookies(["score"]);

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

    const onStartup = () => {
        if (!cookies.score) {
            cleanCookies();
        }
        if (city === "krakow") {
            setStreets(krakowStreets["stare_miasto"]);
        } else {
            setStreets(zakopaneStreets);
        }
        getRandomStreet();
    };

    const enableTooltip = (info) => {
        setHovered(info);
        setVisible(true);
        setName(info.object.properties.name);
    };

    const changeDivision = (div) => {
        if (div === division) {
            getRandomStreet();
        } else {
            setDivision(div);
            setStreets(krakowStreets[div]);
        }
    };

    const getRandomStreet = () => {
        if (Object.keys(streets).length === 0) {
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
                        case "yellow":
                            return 0.4;
                        case "red":
                            return 0.8;
                        default:
                            return 1.5;
                    }
                } else {
                    return 1;
                }
            }),
        ]).item;

        setCurrentStreet(streets[random_street_key]);
        setVisible(false);
    };

    const changeRadius = () => {
        const ellipse = new ScatterplotLayer({
            id: "ellipse",
            data: [
                {
                    position: [center[city][1], center[city][0]],
                    radius: radius,
                },
            ],
            stroked: true,
            filled: true,
            radiusScale: 1,
            radiusMinPixels: 1,
            lineWidthMinPixels: 1,
            getLineWidth: 100,
            getPosition: (d) => d.position,
            getRadius: (d) => d.radius,
            getFillColor: [255, 0, 0, 100],
            getLineColor: [255, 0, 0, 255],
        });

        setLayers(ellipse);
    };

    const distanceConvertToMeters = (distance) => {
        return distance * 111139;
    };

    const distanceInMeters = (pointA, pointB) => {
        const distance = Math.sqrt(
            Math.pow(Math.abs(pointA[0] - pointB[0]), 2) +
            Math.pow(Math.abs(pointA[1] - pointB[1]), 2),
        );

        return distanceConvertToMeters(distance);
    };

    const onSaveRadius = () => {
        setStreets(
            filterObj(
                zakopaneStreets,
                (street) =>
                    distanceInMeters(
                        [street[0].path[0][1], street[0].path[0][0]],
                        center[city],
                    ) <= radius,
            ),
        );

        setRadiusEnabled(false);
    };

    useEffect(() => {
        onStartup();
    }, []);

    useEffect(() => {
        if (layers.id === "divisions-layer") {
            setQuizEnabled(false);
        } else {
            setQuizEnabled(true);
        }
    }, [layers]);

    useEffect(() => {
        getRandomStreet();
    }, [streets]);

    useEffect(() => {
        switch (city) {
            case "krakow":
                setDivision("stare_miasto");
                enableDivisionsView();
                break;
            case "zakopane":
                setDivision("zakopane");
                setStreets(zakopaneStreets);
        }

        if (division === undefined) {
            if (city === "krakow") {
                setDivision("stare_miasto");
            } else {
                setDivision("zakopane");
            }
        }
    }, [city]);

    const focusOnStreet = () => {
        setViewState({
            longitude: currentStreet[0].path[0][0],
            latitude: currentStreet[0].path[0][1],
            zoom: 16,
            transitionDuration: 1000,
            transitionInterpolator: new FlyToInterpolator(),
        });
    };

    useEffect(() => {
        focusOnStreet(currentStreet);

        setLayers(
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
        );
    }, [currentStreet, streetsToDraw]);

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

    useEffect(() => {
        if (radiusEnabled) {
            changeRadius();
            setControllerEnabled(false);
            setViewState({
                longitude: center[city][1],
                latitude: center[city][0],
                zoom: 11.5,
                transitionDuration: 1000,
                transitionInterpolator: new FlyToInterpolator(),
            });
        } else {
            getRandomStreet();
            setControllerEnabled(true);
        }
    }, [radiusEnabled]);

    useEffect(() => {
        changeRadius();
        setViewState({
            ...viewState,
            zoom: clamp(15 - radius / 1000, 10.5, 15),
        });
    }, [radius]);

    return (
        <div className="flex h-screen w-screen items-end justify-center sm:items-start sm:justify-end">
            <div className="">
                {visible && (
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
                <MapComponent />
            </div>
            <ControlPanel
                cleanCookies={cleanCookies}
                getRandomStreet={getRandomStreet}
                onSaveRadius={onSaveRadius}
            />
            <Changelog
                version={changelog.version}
                changes={changelog.changes}
            />
        </div>
    );
}

export default function App() {
    return (
        <MapProvider>
            <MapGuess />
        </MapProvider>
    );
}

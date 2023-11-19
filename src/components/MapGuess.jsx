import { useEffect, useState } from "react";
import DeckGL, { FlyToInterpolator } from "deck.gl";
import Map from "react-map-gl";
import { PathLayer, PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { useCookies } from "react-cookie";

import {
  Button,
  Text,
  Badge,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
} from "@chakra-ui/react";

import krakowStreets from "../data/krakow_divisions.json";
import krakowDivisions from "../data/krakow_divisions_filtered.json";
import zakopaneStreets from "../data/zakopane_streets.json";

import {
  filterObj,
  clamp,
  weightedRandom,
  findIndexByName,
} from "../scripts/scripts";
import Quiz from "./Quiz";
import { Login } from "./Login";

const center = {
  krakow: [50.06168144356519, 19.937328289497746],
  zakopane: [49.29389943354241, 19.95370589727813],
};

const initialViewState = {
  longitude: center.krakow[0],
  latitude: center.krakow[1],
  zoom: 10.5,
  controller: true,
};

function MapGuess() {
  const [userRef, setUserRef] = useState();
  const [viewState, setViewState] = useState({
    ...initialViewState,
  });
  const [hovered, setHovered] = useState();
  const [isControllerEnabled, setControllerEnabled] = useState(true);
  const [visible, setVisible] = useState(false);
  const [quizEnabled, setQuizEnabled] = useState(true);
  const [radius, setRadius] = useState(1000);
  const [radiusEnabled, setRadiusEnabled] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("krakow");
  const [streets, setStreets] = useState(krakowStreets["stare_miasto"]);
  const [division, setDivision] = useState("stare_miasto");
  const [streetsToDraw, setStreetsToDraw] = useState([]);
  const [currentStreet, setCurrentStreet] = useState([
    { name: "loading", path: [[0, 0]] },
  ]);
  const [layers, setLayers] = useState(
    new PathLayer({
      id: "path-layer",
      data: currentStreet,
      getWidth: 7,
      getColor: [255, 0, 0],
      widthMinPixels: 3,
    })
  );

  const divisionsLayer = new PolygonLayer({
    id: "divisions-layer",
    data: krakowDivisions.features,
    pickable: true,
    filled: true,
    lineWidthMinPixels: 1,
    lineJointRounded: true,
    getPolygon: (d) => d.geometry.coordinates,
    getFillColor: [199, 149, 80, 50],
    getLineColor: [235, 140, 9],
    getLineWidth: 100,
    highlightColor: [255, 255, 255, 100],
    autoHighlight: true,
    onClick: (info) =>
      changeDivision(
        info.object.properties.name.toLowerCase().replace(" ", "_")
      ),
    onHover: (info) => (info.picked ? enableTooltip(info) : setVisible(false)),
  });

  const enableTooltip = (info) => {
    setHovered(info);
    setVisible(true);
    setName(info.object.properties.name);
  };

  const changeDivision = (div) => {
    console.log(div, division);
    if (div === division) {
      getRandomStreet();
    } else {
      setDivision(div);
      setStreets(krakowStreets[div]);
    }
  };

  const [cookies, setCookie] = useCookies(["score"]);

  const cleanCookies = () => {
    const new_score = Object.keys(krakowStreets).reduce(
      (o, key) => ({
        ...o,
        [key]: { correct: 0, wrong: 0, known: [], mistakes: [] },
      }),
      {}
    );

    setCookie("score", {
      krakow: new_score,
      zakopane: { zakopane: { correct: 0, wrong: 0, known: [], mistakes: [] } },
    });
  };

  const onStartup = () => {
    !cookies.score ? cleanCookies() : {};
    getRandomStreet();
  };

  const enableDivisionsView = () => {
    setCity("krakow");
    setViewState({
      latitude: 50.06168144356519,
      longitude: 19.937328289497746,
      zoom: 10.5,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
    });
    setLayers(divisionsLayer);
  };

  const getRandomStreet = () => {
    const random_street_key = weightedRandom(Object.keys(streets), [
      ...Object.keys(streets).map((e) => {
        if (streetsToDraw.map((e) => e.name).includes(e)) {
          switch (streetsToDraw[findIndexByName(streetsToDraw, e)].color) {
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

    console.log(streets[random_street_key]);
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
        Math.pow(Math.abs(pointA[1] - pointB[1]), 2)
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
            center[city]
          ) <= radius
      )
    );

    setRadiusEnabled(false);
  };

  useEffect(() => {
    onStartup();
  }, []);

  useEffect(() => {
    if (layers === divisionsLayer) {
      setQuizEnabled(false);
    } else {
      setQuizEnabled(true);
    }
  }, [layers]);

  useEffect(() => {
    console.log("streets", Object.keys(streets).length, streets);
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

  useEffect(() => {
    setViewState({
      longitude: currentStreet[0].path[0][0],
      latitude: currentStreet[0].path[0][1],
      zoom: 16,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
    });

    setLayers(
      new PathLayer({
        id: "path-layer",
        data: [
          ...currentStreet.map((e) => ({ ...e, color: "selected" })),
          ...streetsToDraw.map((e) =>
            e.name === currentStreet[0].name ? { ...e, color: "selected" } : e
          ),
        ],
        getWidth: (d) => (d.color === "selected" ? 7 : 4),
        capRounded: true,
        jointRounded: true,
        getColor: (d) => getColor(d.color),
        widthMinPixels: 3,
      })
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
    <div className="flex h-screen">
      <div className="m-5 justify-center align-center">
        {visible ? (
          <Badge
            className="fixed z-10"
            fontSize="2xl"
            style={{
              left: hovered.x + 40,
              top: hovered.y + 70,
              pointerEvents: "none",
            }}
          >
            {name}
          </Badge>
        ) : (
          ""
        )}
        <DeckGL
          initialViewState={{
            longitude: center.krakow[0],
            latitude: center.krakow[1],
            zoom: 10.5,
            controller: true,
          }}
          viewState={viewState}
          onViewStateChange={(e) => setViewState(e.viewState)}
          style={{
            width: "70%",
            height: "80%",
            left: "2%",
            top: "5%",
          }}
          controller={isControllerEnabled}
          layers={layers}
        >
          <Map
            longitude={viewState.longitude}
            latitude={viewState.latitude}
            className="rounded-lg"
            mapStyle="mapbox://styles/hangorus/clnwcu8aj004j01r26fh0fh1t"
            mapboxAccessToken="pk.eyJ1IjoiaGFuZ29ydXMiLCJhIjoiY2s4OTRtY3h6MDJ1bDNmazZwa2lpMXd2aiJ9.OLbJaQCSeZfv2vJ9RGduMg"
          />
        </DeckGL>
      </div>
      <div className="flex flex-col m-5 absolute right-5 top-5">
        {radiusEnabled ? (
          <div className="flex flex-col justify-center align-center">
            <Text fontSize="xl" fontWeight="bold">
              Ustaw promień
            </Text>
            <Slider
              className="mt-10"
              defaultValue={radius}
              min={500}
              max={8000}
              step={50}
              onChange={(val) => setRadius(val)}
            >
              <SliderMark
                value={radius}
                textAlign="center"
                bg="blue.500"
                color="white"
                mt="-10"
                ml="-5"
                w="15"
              >
                {(radius / 1000).toFixed(2)}km
              </SliderMark>
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Button
              className="mt-3"
              type="button"
              onClick={() => setRadiusEnabled(false)}
            >
              Anuluj
            </Button>
            <Button
              className="mt-3"
              type="button"
              onClick={() => onSaveRadius()}
            >
              Zapisz
            </Button>
          </div>
        ) : (
          <div>
            {userRef}
            <Text fontSize="xl" fontWeight="bold">
              {division
                .split("_")
                .map((word) => {
                  return word.slice(0, 1).toUpperCase() + word.slice(1);
                })
                .join(" ")}
            </Text>
            <div className="flex">
              <Button
                className="mr-4"
                type="button"
                onClick={enableDivisionsView}
              >
                Zmień dzielnicę
              </Button>
              <Login setUserRef={setUserRef} />
            </div>

            {city !== "krakow" && (
              <Button type="button" onClick={() => setRadiusEnabled(true)}>
                Ustaw promień
              </Button>
            )}
            <div className="flex my-3 justify-center">
              <Button
                className="mr-4"
                type="button"
                onClick={() => {
                  city === "krakow" ? setCity("zakopane") : setCity("krakow");
                }}
              >
                {city === "krakow" ? "Zakopane" : "Kraków"}
              </Button>
              <Button type="button" onClick={() => cleanCookies()}>
                Zresetuj postępy
              </Button>
            </div>
            {!userRef && "Zaloguj się aby zapisywać postępy"}
            {quizEnabled && (
              <Quiz
                correct={currentStreet[0].name}
                streets={streets}
                newStreet={getRandomStreet}
                city={city}
                division={division}
                userRef={userRef}
                streetsToDraw={streetsToDraw}
                setStreetsToDraw={setStreetsToDraw}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MapGuess;

import { useEffect, useState } from "react";
import DeckGL, { FlyToInterpolator } from "deck.gl";
import Map from "react-map-gl";
import { PathLayer, PolygonLayer } from "@deck.gl/layers";
import { useCookies } from "react-cookie";

import { Button, Text, Badge } from "@chakra-ui/react";

import krakowStreets from "../data/krakow_divisions.json";
import krakowDivisions from "../data/krakow_divisions_filtered.json";
import zakopaneStreets from "../data/zakopane_streets.json";
import krakowWeights from "../data/krakow_weights.json";
import zakopaneWeights from "../data/zakopane_weights.json";

import weightedRandom from "../scripts/weighted_random";
import Quiz from "./Quiz";

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
  const [viewState, setViewState] = useState({
    ...initialViewState,
  });
  const [hovered, setHovered] = useState();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("krakow");
  const [streets, setStreets] = useState(krakowStreets["stare_miasto"]);
  const [division, setDivision] = useState("stare_miasto");
  const [weights, setWeights] = useState(krakowWeights["stare_miasto"]);
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

  const divisions_layer = new PolygonLayer({
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
      setWeights(krakowWeights[div]);
    }
    // getRandomStreet();
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
    setLayers(divisions_layer);
  };

  const getRandomStreet = () => {
    const random_street_key = weightedRandom(
      Object.keys(weights),
      Object.values(weights)
    ).item;

    setCurrentStreet(streets[random_street_key]);
    setVisible(false);

    console.log(streets[random_street_key][0]);
  };

  useEffect(() => {
    onStartup();
  }, []);

  useEffect(() => {
    getRandomStreet();
  }, [streets]);

  useEffect(() => {
    switch (city) {
      case "krakow":
        setDivision("stare_miasto");
        // setStreets(krakowStreets[division]);
        // setWeights(krakowWeights[division]);
        enableDivisionsView();
        break;
      case "zakopane":
        setDivision("zakopane");
        setStreets(zakopaneStreets);
        setWeights(zakopaneWeights);
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
        data: currentStreet,
        getWidth: 7,
        lineJointRounded: true,
        getColor: [255, 0, 0],
        widthMinPixels: 7,
      })
    );
  }, [currentStreet]);

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
          controller={true}
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
        <Text fontSize="xl" fontWeight="bold">
          {division
            .split("_")
            .map((word) => {
              return word.slice(0, 1).toUpperCase() + word.slice(1);
            })
            .join(" ")}
        </Text>
        <Button type="button" onClick={enableDivisionsView}>
          Zmień dzielnicę
        </Button>
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
          {/* <h1>{currentStreet[0].name}</h1> */}
        </div>
        <Quiz
          correct={currentStreet[0].name}
          streets={streets}
          newStreet={getRandomStreet}
          city={city}
          division={division}
        />
      </div>
    </div>
  );
}

export default MapGuess;

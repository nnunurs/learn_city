import { useEffect, useState } from "react";
import DeckGL from "@deck.gl/react";
import Map from "react-map-gl";
import { PathLayer } from "@deck.gl/layers";
import { useCookies } from "react-cookie";

import krakowStreets from "../data/krakow_streets.json";
import zakopaneStreets from "../data/zakopane_streets.json";
import krakowWeights from "../data/krakow_weights.json";
import zakopaneWeights from "../data/zakopane_weights.json";

import weightedRandom from "../scripts/weighted_random";
import Quiz from "./Quiz";

function MapGuess() {
  const [lon, setLon] = useState(0.0);
  const [lat, setLat] = useState(0.0);
  const [city, setCity] = useState("zakopane");
  const [streets, setStreets] = useState(zakopaneStreets);
  const [weights, setWeights] = useState(zakopaneWeights);
  const [currentStreet, setCurrentStreet] = useState([
    { name: "loading", path: [[0, 0]] },
  ]);
  const [layers, setLayers] = useState(
    new PathLayer({
      id: "path-layer",
      data: currentStreet,
      getWidth: (data) => 7,
      getColor: (data) => [255, 0, 0],
      widthMinPixels: 3,
    })
  );

  const [cookies, setCookie] = useCookies(["score"]);

  const cleanCookies = () => {
    setCookie("score", {
      krakow: { correct: 0, wrong: 0, known: [], mistakes: [] },
      zakopane: {
        correct: 0,
        wrong: 0,
        known: [],
        mistakes: [],
      },
    });
  };

  const onStartup = () => {
    !cookies.score ? cleanCookies() : {};
    getRandomStreet();
  };

  const getRandomStreet = () => {
    // const random_street_key =
    //   Object.keys(streets)[
    //     Math.floor(Math.random() * Object.keys(streets).length)
    //   ];
    const random_street_key = weightedRandom(
      Object.keys(weights),
      Object.values(weights)
    ).item;

    setCurrentStreet(streets[random_street_key]);

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
        setStreets(krakowStreets);
        setWeights(krakowWeights);
        break;
      case "zakopane":
        setStreets(zakopaneStreets);
        setWeights(zakopaneWeights);
    }
  }, [city]);

  useEffect(() => {
    setLat(parseFloat(currentStreet[0].path[0][1]));
    setLon(parseFloat(currentStreet[0].path[0][0]));

    setLayers(
      new PathLayer({
        id: "path-layer",
        data: currentStreet,
        getWidth: (data) => 7,
        getColor: (data) => [255, 0, 0],
        widthMinPixels: 7,
      })
    );
  }, [currentStreet]);

  return (
    <div className="flex">
      <div className="m-5 justify-center align-center">
        <DeckGL
          initialViewState={{
            longitude: lon,
            latitude: lat,
            zoom: 16,
          }}
          style={{ width: 1300, height: 800, position: "relative" }}
          controller={true}
          layers={layers}
        >
          <Map
            className="rounded-lg"
            mapStyle="mapbox://styles/hangorus/clnwcu8aj004j01r26fh0fh1t"
            mapboxAccessToken="pk.eyJ1IjoiaGFuZ29ydXMiLCJhIjoiY2s4OTRtY3h6MDJ1bDNmazZwa2lpMXd2aiJ9.OLbJaQCSeZfv2vJ9RGduMg"
          />
        </DeckGL>
      </div>
      <div className="flex flex-col m-5">
        <div className="flex m-3 ">
          <button
            type="button"
            onClick={() => {
              city === "krakow" ? setCity("zakopane") : setCity("krakow");
            }}
          >
            {city === "krakow" ? "Zakopane" : "Kraków"}
          </button>
          {/* <button type="button" onClick={getRandomStreet}>
            Random street
          </button> */}
          <button type="button" onClick={() => cleanCookies()}>
            Zresetuj postępy
          </button>
          {/* <h1>{currentStreet[0].name}</h1> */}
        </div>
        <Quiz
          correct={currentStreet[0].name}
          streets={streets}
          newStreet={getRandomStreet}
          city={city}
        />
      </div>
    </div>
  );
}

export default MapGuess;

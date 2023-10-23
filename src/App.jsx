import { useEffect, useState } from "react";
import DeckGL from "@deck.gl/react";
import Map from "react-map-gl";
import { PathLayer } from "@deck.gl/layers";
import streets from "./data/krakow_streets.json";
import weights from "./data/krakow_weights.json";
import weightedRandom from "./scripts/weighted_random";

import Quiz from "./components/Quiz";

function App() {
  const [lon, setLon] = useState(0.0);
  const [lat, setLat] = useState(0.0);
  const [zoom, setZoom] = useState(16.0);
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
    getRandomStreet();
  }, []);

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
    <div>
      <div className="flex flex-row">
        <div className="flex m-3">
          <button type="button" onClick={() => setZoom(zoom + 0.5)}>
            Zoom
          </button>
          <button type="button" onClick={getRandomStreet}>
            Random street
          </button>
          {/* <h1>{currentStreet[0].name}</h1> */}
        </div>
        <Quiz correct={currentStreet[0].name} newStreet={getRandomStreet} />
      </div>
      <div className="m-5 justify-center align-center">
        <DeckGL
          initialViewState={{
            longitude: lon,
            latitude: lat,
            zoom: zoom,
          }}
          style={{ width: 1300, height: 800, position: "relative" }}
          controller={true}
          layers={layers}
        >
          <Map
            mapStyle="mapbox://styles/hangorus/clnwcu8aj004j01r26fh0fh1t"
            mapboxAccessToken="pk.eyJ1IjoiaGFuZ29ydXMiLCJhIjoiY2s4OTRtY3h6MDJ1bDNmazZwa2lpMXd2aiJ9.OLbJaQCSeZfv2vJ9RGduMg"
          />
        </DeckGL>
      </div>
    </div>
  );
}

export default App;

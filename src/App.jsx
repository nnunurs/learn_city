import { useEffect, useState } from "react";
import DeckGL from "@deck.gl/react";
import Map from "react-map-gl";
import { PathLayer } from "@deck.gl/layers";
import streets from "./data/out_with_shape.json";

import Quiz from "./components/Quiz";

const data = [
  {
    name: "random-name",
    color: [101, 147, 245],
    path: [
      [-74.00578, 40.713067],
      [-74.004577, 40.712425],
      [-74.003626, 40.71365],
      [-74.002666, 40.714243],
      [-74.002136, 40.715177],
      [-73.998493, 40.713452],
      [-73.997981, 40.713673],
      [-73.997586, 40.713448],
      [-73.99256, 40.713863],
    ],
  },
];

function App() {
  const [lon, setLon] = useState(0.0);
  const [lat, setLat] = useState(0.0);
  const [zoom, setZoom] = useState(16.0);
  const [currentStreet, setCurrentStreet] = useState([
    { lon: 0.0, lat: 0.0, name: "loading" },
  ]);
  const [layers, setLayers] = useState(
    new PathLayer({
      id: "path-layer",
      data,
      getWidth: (data) => 7,
      getColor: (data) => [255, 0, 0],
      widthMinPixels: 7,
    })
  );

  const getRandomStreet = () => {
    const random_street_key =
      Object.keys(streets)[
        Math.floor(Math.random() * Object.keys(streets).length)
      ];

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
          <h1>{currentStreet[0].name}</h1>
        </div>
        <Quiz correct={currentStreet[0].name} />
      </div>
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
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken="pk.eyJ1IjoiaGFuZ29ydXMiLCJhIjoiY2s4OTRtY3h6MDJ1bDNmazZwa2lpMXd2aiJ9.OLbJaQCSeZfv2vJ9RGduMg"
        />
      </DeckGL>
    </div>
  );
}

export default App;

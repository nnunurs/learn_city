import { useState } from "react";
import "./App.css";

import Map from "react-map-gl";
import data from "./data/out.json";
import DeckGL from "@deck.gl/react";
import { LineLayer } from "@deck.gl/layers";

function App() {
  const [long, setLong] = useState(0.0);
  const [lat, setLat] = useState(0.0);
  const [zoom, setZoom] = useState(18.0);

  const layer_data = [
    {
      sourcePosition: [-122.41669, 37.7853],
      targetPosition: [-122.41669, 37.781],
    },
  ];

  const layers = [new LineLayer({ id: "line-layer", layer_data })];

  const randomStreet = () => {
    const rand_key = data[Math.floor(Math.random() * data.length)];

    console.log(rand_key);
    setLat(parseFloat(rand_key.lat));
    setLong(parseFloat(rand_key.lon));
  };

  const INITIAL_VIEW_STATE = {
    longitude: -122.41669,
    latitude: 37.7853,
    zoom: 13,
    pitch: 0,
    bearing: 0,
  };

  return (
    <div className="flex flex-col">
      <div className="flex m-3">
        <button type="button" onClick={() => setLong(long + 10)}>
          Move
        </button>
        <button type="button" onClick={() => setZoom(zoom + 0.5)}>
          Zoom
        </button>
        <button type="button" onClick={randomStreet}>
          Random street
        </button>
      </div>

      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        style={{ width: 1000, height: 600, position: "relative" }}
      >
        <Map
          mapLib={import("mapbox-gl")}
          initialViewState={{
            longitude: -100,
            latitude: 40,
            zoom: 18,
          }}
          longitude={long}
          latitude={lat}
          zoom={zoom}
          mapStyle="mapbox://styles/mapbox/streets-v9"
          mapboxAccessToken="pk.eyJ1IjoiaGFuZ29ydXMiLCJhIjoiY2s4OTRtY3h6MDJ1bDNmazZwa2lpMXd2aiJ9.OLbJaQCSeZfv2vJ9RGduMg"
        />
      </DeckGL>
    </div>
  );
}

export default App;

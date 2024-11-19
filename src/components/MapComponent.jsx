import { useContext } from "react";
import DeckGL from "deck.gl";
import Map from "react-map-gl";
import MapContext from "../context/MapContext";

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

function MapComponent() {
  const { viewState, setViewState, layers, isControllerEnabled } = useContext(MapContext);

  return (
    <DeckGL
      viewState={viewState}
      onViewStateChange={(e) => setViewState(e.viewState)}
      controller={{
        doubleClickZoom: false,
        minZoom: 10.5,
        maxZoom: 18,
      }}
      layers={layers}
    >
      <Map
        longitude={viewState.longitude}
        latitude={viewState.latitude}
        mapStyle="mapbox://styles/hangorus/clnwcu8aj004j01r26fh0fh1t"
        mapboxAccessToken="pk.eyJ1IjoiaGFuZ29ydXMiLCJhIjoiY2s4OTRtY3h6MDJ1bDNmazZwa2lpMXd2aiJ9.OLbJaQCSeZfv2vJ9RGduMg"
      />
    </DeckGL>
  );
}

export default MapComponent;
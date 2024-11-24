import PropTypes from "prop-types";
import DeckGL from "deck.gl";
import Map from "react-map-gl";
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';

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

function MapComponent({ viewState, setViewState, layers, isControllerEnabled, markers, pathData }) {
  const markerLayer = new ScatterplotLayer({
    id: 'markers',
    data: markers || [],
    pickable: true,
    opacity: 0.8,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 6,
    radiusMaxPixels: 15,
    lineWidthMinPixels: 2,
    getPosition: d => d.position,
    getFillColor: d => d.color,
    getLineColor: d => d.border,
    getRadius: d => d.size
  });

  const pathLayer = new PathLayer({
    id: 'path-layer',
    data: pathData || [],
    pickable: true,
    widthScale: 1,
    widthMinPixels: 2,
    getPath: d => d.path,
    getColor: d => d.color,
    getWidth: d => d.width
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e) => setViewState(e.viewState)}
        controller={{
          doubleClickZoom: false,
          minZoom: 10.5,
          maxZoom: 18,
          ...(!isControllerEnabled && { dragPan: false, dragRotate: false }),
        }}
        layers={[...layers, pathLayer, markerLayer]}
        getCursor={() => 'pointer'}
      >
        <Map
          mapStyle="mapbox://styles/hangorus/clnwcu8aj004j01r26fh0fh1t"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          reuseMaps
          preventStyleDiffing
        />
      </DeckGL>
    </div>
  );
}

MapComponent.propTypes = {
  viewState: PropTypes.shape({
    longitude: PropTypes.number.isRequired,
    latitude: PropTypes.number.isRequired,
    zoom: PropTypes.number.isRequired,
  }).isRequired,
  setViewState: PropTypes.func.isRequired,
  layers: PropTypes.array.isRequired,
  isControllerEnabled: PropTypes.bool.isRequired,
};

export default MapComponent;
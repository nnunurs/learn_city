import PropTypes from "prop-types";
import DeckGL from "deck.gl";
import Map from "react-map-gl";
import { ScatterplotLayer, PathLayer, PolygonLayer } from '@deck.gl/layers';

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

function MapComponent({ viewState, setViewState, layers, markers, pathData, optimalPathData, quizPathData, onDivisionHover, onDivisionClick, divisionsData }) {
  const getColor = (color) => {
    switch (color) {
      case "selected":
        return [162, 73, 230];
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
    getWidth: d => d.width,
    capRounded: true,
    jointRounded: true,
    getColor: d => d.color,
    widthMinPixels: 3
  });

  const optimalPathLayer = new PathLayer({
    id: 'optimal-path-layer',
    data: optimalPathData || [],
    pickable: true,
    widthScale: 1,
    widthMinPixels: 2,
    getPath: d => d.path,
    getColor: d => d.color,
    getWidth: d => d.width,
    getDashArray: () => [20, 10],
    dashJustified: true,
    capRounded: true,
    jointRounded: true
  });

  const quizPathLayer = new PathLayer({
    id: 'quiz-path-layer',
    data: quizPathData || [],
    pickable: true,
    widthScale: 1,
    widthMinPixels: 2,
    getPath: d => d.path,
    getColor: d => getColor(d.color),
    getWidth: d => (d.color === "selected" ? 10 : 5),
    capRounded: true,
    jointRounded: true
  });

  const divisionsLayer = new PolygonLayer({
    id: 'divisions-layer',
    data: divisionsData || [],
    pickable: true,
    stroked: true,
    filled: true,
    wireframe: true,
    lineWidthMinPixels: 2,
    lineJointRounded: true,
    getPolygon: d => d.geometry.coordinates[0],
    getWidth: d => 10,
    getLineColor: [238, 117, 8],
    getFillColor: [225, 178, 141, 70],
    
    onHover: info => {
      if (info.object) {
        onDivisionHover && onDivisionHover({
          x: info.x,
          y: info.y,
          name: info.object.properties.name
        });
      } else {
        onDivisionHover && onDivisionHover(null);
      }
    },
    onClick: info => {
      if (info.object) {
        onDivisionClick && onDivisionClick(info.object.properties.name);
      }
    }
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e) => setViewState(e.viewState)}
        controller={{
          doubleClickZoom: false,
          minZoom: 10.5,
          maxZoom: 18
        }}
        layers={[
          ...(layers || []),
          pathLayer,
          divisionsLayer,
          optimalPathLayer,
          quizPathLayer,
          markerLayer
        ]}
        getCursor={() => 'pointer'}
      >
        <Map
          mapStyle="mapbox://styles/hangorus/clnwcu8aj004j01r26fh0fh1t"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          reuseMaps
          preventStyleDiffing
          transformRequest={(url, resourceType) => {
            if (resourceType === 'Style' && !url) {
              return { url: 'mapbox://styles/mapbox/dark-v10' };
            }
            return { url };
          }}
          onError={(error) => {
            if (error.message.includes('Failed to evaluate expression')) {
              return;
            }
            console.error('Mapbox error:', error);
          }}
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
  markers: PropTypes.array,
  pathData: PropTypes.array,
  optimalPathData: PropTypes.array,
  divisionsData: PropTypes.array
};

export default MapComponent;
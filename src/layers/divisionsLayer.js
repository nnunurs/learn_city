import { GeoJsonLayer } from "deck.gl";
import krakowDivisions from "../data/krakow_divisions_filtered.json";

const validateCoordinates = (coordinates) => {
  const isValidPoint = point => 
    point[0] >= 19.7 && point[0] <= 20.3 && 
    point[1] >= 49.8 && point[1] <= 50.3;

  const validPoints = coordinates.filter(isValidPoint);
  return validPoints.length > coordinates.length * 0.9;
};

export const createDivisionsLayer = (onClick, onHover) => {
  const validFeatures = krakowDivisions.features
    .filter(feature => validateCoordinates(feature.geometry.coordinates[0]))
    .map(feature => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: feature.geometry.coordinates.map(ring => 
          ring.filter((_, i) => i % 2 === 0)
        )
      }
    }));

  return new GeoJsonLayer({
    id: "divisions",
    data: {
      type: "FeatureCollection",
      features: validFeatures
    },
    pickable: true,
    stroked: true,
    filled: true,
    extruded: false,
    pointType: "circle",
    lineWidthScale: 20,
    lineWidthMinPixels: 2,
    getFillColor: [147, 147, 255, 100],
    getLineColor: [100, 100, 100, 255],
    getPointRadius: 100,
    getLineWidth: 1.5,
    onClick,
    onHover,
    parameters: {
      depthTest: false
    },
    _normalize: false,
    extensions: [],
    updateTriggers: {}
  });
};
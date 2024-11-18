import { createContext, useState } from "react";
import { FlyToInterpolator } from "deck.gl";
import { createDivisionsLayer } from "../layers/divisionsLayer";
const MapContext = createContext();
import PropTypes from "prop-types";

export const MapProvider = ({ children }) => {
  const [userRef, setUserRef] = useState();
  const [viewState, setViewState] = useState({
    longitude: 50.06168144356519,
    latitude: 19.937328289497746,
    zoom: 10.5,
    controller: true,
  });
  const [hovered, setHovered] = useState();
  const [isControllerEnabled, setControllerEnabled] = useState(true);
  const [visible, setVisible] = useState(false);
  const [quizEnabled, setQuizEnabled] = useState(true);
  const [radius, setRadius] = useState(1000);
  const [radiusEnabled, setRadiusEnabled] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("krakow");
  const [streets, setStreets] = useState([]);
  const [division, setDivision] = useState("stare_miasto");
  const [streetsToDraw, setStreetsToDraw] = useState([]);
  const [currentStreet, setCurrentStreet] = useState([{ name: "loading", path: [[0, 0]] }]);
  const [layers, setLayers] = useState([]);
  const [showDivisions, setShowDivisions] = useState(false);

  const enableTooltip = (info) => {
    if (info.object) {
      setHovered({
        x: info.x,
        y: info.y,
        name: info.object.properties.name,
      });
      setVisible(true);
      setName(info.object.properties.name);
    } else {
      setHovered(null);
    }
  };

  const changeDivision = (info) => {
    if (info.object) {
      setDivision(info.object.properties.name.toLowerCase().replace(/ /g, "_"));
      setVisible(false);
      setShowDivisions(false);
    }
  };

  const enableDivisionsView = () => {
    console.log('enableDivisionsView wywołane w kontekście');
    setCity("krakow");
    setViewState({
      latitude: 50.06168144356519,
      longitude: 19.937328289497746,
      zoom: 10.5,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
    });
    
    const enableTooltip = (info) => {
      if (info.object) {
        setHovered({
          x: info.x,
          y: info.y,
          object: info.object
        });
        setVisible(true);
        setName(info.object.properties.name);
      } else {
        setVisible(false);
      }
    };

    setLayers([
      createDivisionsLayer(
        (info) => {
          if (info.object) {
            setDivision(info.object.properties.name.toLowerCase().replace(/ /g, "_"));
            setVisible(false);
          }
        },
        enableTooltip
      )
    ]);
    setShowDivisions(true);
  };

  return (
    <MapContext.Provider
      value={{
        userRef,
        setUserRef,
        viewState,
        setViewState,
        hovered,
        setHovered,
        isControllerEnabled,
        setControllerEnabled,
        visible,
        setVisible,
        quizEnabled,
        setQuizEnabled,
        radius,
        setRadius,
        radiusEnabled,
        setRadiusEnabled,
        name,
        setName,
        city,
        setCity,
        streets,
        setStreets,
        division,
        setDivision,
        streetsToDraw,
        setStreetsToDraw,
        currentStreet,
        setCurrentStreet,
        layers,
        setLayers,
        showDivisions,
        setShowDivisions,
        enableDivisionsView,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

MapProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default MapContext;
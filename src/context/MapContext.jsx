import { createContext, useState } from "react";
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
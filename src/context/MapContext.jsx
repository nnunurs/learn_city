import { createContext } from "react";
import PropTypes from "prop-types";

const MapContext = createContext();

export const MapProvider = ({ children }) => {
  return (
    <MapContext.Provider value={{}}>
      {children}
    </MapContext.Provider>
  );
};

MapProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MapContext;
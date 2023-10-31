import { ChakraProvider } from "@chakra-ui/react";
import { CookiesProvider } from "react-cookie";

import MapGuess from "./components/MapGuess";

function App() {
  return (
    <div>
      <ChakraProvider>
        <CookiesProvider defaultSetOptions={{ path: "/" }}>
          <MapGuess />
        </CookiesProvider>
      </ChakraProvider>
    </div>
  );
}

export default App;

import MapGuess from "./components/MapGuess";
import { CookiesProvider } from "react-cookie";

function App() {
  return (
    <div>
      <CookiesProvider defaultSetOptions={{ path: "/" }}>
        <MapGuess />
      </CookiesProvider>
    </div>
  );
}

export default App;

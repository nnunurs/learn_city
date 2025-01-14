import { CookiesProvider } from "react-cookie";
import MapGuess from "./components/MapGuess";
import "./App.css";

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

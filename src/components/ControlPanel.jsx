import { useEffect, useState } from "react";
import { FaFlag, FaRoute, FaMapMarkerAlt } from "react-icons/fa";
import { Login } from "./Login";
import Quiz from "./Quiz";
import PropTypes from "prop-types";
import CityPicker from "./CityPicker";
import NavigationGame from "./NavigationGame";

function ControlPanel({
    getRandomStreet,
    division,
    focusOnStreet,
    enableDivisionsView,
    cancelDivisionsView,
    currentStreet,
    streets,
    userRef,
    setUserRef,
    quizEnabled,
    streetsToDraw,
    setStreetsToDraw,
    isDivisionsView,
    setMarkers,
    setPathData,
    setViewState,
    gameMode,
    setGameMode,
    setOptimalPathData,
    setQuizPathData,
    navigationRef,
    setNavigationRef,
}) {
    const [isHardMode, setIsHardMode] = useState(false);

    useEffect(() => {
        console.log("ControlPanel - userRef changed:", userRef);
        console.log("ControlPanel - current division:", division);
        console.log("ControlPanel - streets available:", streets ? Object.keys(streets).length : 0);

        // Reset state when userRef changes
        if (!userRef) {
            setStreetsToDraw([]);
            setMarkers([]);
            setPathData([]);
            setOptimalPathData([]);
            setQuizPathData([]);
            setNavigationRef(null);
            setIsHardMode(false);
        }
    }, [userRef]);

    // Handle game mode changes
    useEffect(() => {
        console.log("Game mode changed to:", gameMode);
        if (!userRef) return;

        const resetGameState = () => {
            setStreetsToDraw([]);
            setMarkers([]);
            setPathData([]);
            setOptimalPathData([]);
            setQuizPathData([]);
            setNavigationRef(null);
            setIsHardMode(false);
        };

        resetGameState();

        // Give components time to reset before initializing new mode
        setTimeout(() => {
            if (gameMode === 'quiz' && getRandomStreet) {
                getRandomStreet();
            }
        }, 100);
    }, [gameMode, userRef]);

    return (
        <div className="absolute top-0 right-0 z-10 p-4 flex flex-col gap-4">
            {!userRef ? (
                <div className="flex flex-col gap-2">
                    <p className="text-center">Zaloguj sie by zagrać</p>
                    <Login setUserRef={setUserRef}>
                        {(onOpen) => (
                            <button
                                onClick={onOpen}
                                className="btn btn-primary"
                            >
                                Zaloguj
                            </button>
                        )}
                    </Login>
                </div>
            ) : (
                <>
                    <div className="bg-base-100 bg-opacity-90 rounded-lg px-4 py-2 flex items-center gap-4 justify-end">
                        <button
                            onClick={isDivisionsView ? cancelDivisionsView : enableDivisionsView}
                            className={`btn btn-ghost btn-sm ${isDivisionsView ? "btn-error" : ""}`}
                            title={isDivisionsView ? "Anuluj wybór dzielnicy" : "Zmień dzielnicę"}
                        >
                            {isDivisionsView ? (
                                <>
                                    <span className="font-bold">Anuluj</span>
                                </>
                            ) : (
                                <>
                                    <span className="font-bold">{division.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</span>
                                </>
                            )}
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setGameMode("navigation")}
                                className={`btn btn-sm ${gameMode === "navigation" ? "btn-primary" : "btn-ghost"} ${isDivisionsView || !userRef ? "btn-disabled opacity-50" : ""}`}
                                title={isDivisionsView ? "Najpierw wybierz dzielnicę" : "Navigation Challenge"}
                                disabled={isDivisionsView || !userRef}
                            >
                                <FaRoute className="inline mr-1" /> Navigation
                            </button>
                            <button
                                onClick={() => setGameMode("quiz")}
                                className={`btn btn-sm ${gameMode === "quiz" ? "btn-primary" : "btn-ghost"} ${isDivisionsView || !userRef ? "btn-disabled opacity-50" : ""}`}
                                title={isDivisionsView ? "Najpierw wybierz dzielnicę" : "Street Quiz"}
                                disabled={isDivisionsView || !userRef}
                            >
                                <FaMapMarkerAlt className="inline mr-1" /> Quiz
                            </button>
                            {gameMode === "quiz" && (
                                <div className="flex items-center gap-2">
                                    <label className="swap swap-flip">
                                        <input
                                            type="checkbox"
                                            checked={isHardMode}
                                            onChange={(e) => {
                                                setIsHardMode(e.target.checked);
                                                if (e.target.checked) {
                                                    // Czyścimy mapę przy wejściu w tryb hard
                                                    setStreetsToDraw([]);
                                                    setMarkers([]);
                                                    setPathData([]);
                                                    setOptimalPathData([]);
                                                    setQuizPathData([]);
                                                } else {
                                                    // Przywracamy normalne zachowanie quizu
                                                    if (getRandomStreet) {
                                                        getRandomStreet();
                                                    }
                                                }
                                            }}
                                        />
                                        <div className="swap-on">Hard</div>
                                        <div className="swap-off">Easy</div>
                                    </label>
                                </div>
                            )}
                        </div>
                        <Login setUserRef={setUserRef} />
                    </div>
                    {division && streets && userRef && (
                        <div className="bg-base-100 bg-opacity-90 rounded-lg p-4">
                            {gameMode === "quiz" ? (
                                <Quiz
                                    correct={currentStreet[0].name}
                                    streets={streets}
                                    streetsToDraw={streetsToDraw}
                                    setStreetsToDraw={setStreetsToDraw}
                                    newStreet={getRandomStreet}
                                    division={division}
                                    userRef={userRef}
                                    focusOnStreet={focusOnStreet}
                                    isHardMode={isHardMode}
                                />
                            ) : gameMode === "navigation" ? (
                                <NavigationGame
                                    streets={streets}
                                    division={division}
                                    userRef={userRef}
                                    setStreetsToDraw={setStreetsToDraw}
                                    focusOnStreet={focusOnStreet}
                                    setMarkers={setMarkers}
                                    setPathData={setPathData}
                                    setViewState={setViewState}
                                    setOptimalPathData={setOptimalPathData}
                                    setQuizPathData={setQuizPathData}
                                    setNavigationRef={setNavigationRef}
                                />
                            ) : null}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

ControlPanel.propTypes = {
    getRandomStreet: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
    hovered: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
    }),
    name: PropTypes.string,
    division: PropTypes.string,
    focusOnStreet: PropTypes.func.isRequired,
    enableDivisionsView: PropTypes.func.isRequired,
    cancelDivisionsView: PropTypes.func.isRequired,
    currentStreet: PropTypes.array,
    streets: PropTypes.object,
    userRef: PropTypes.string,
    setUserRef: PropTypes.func.isRequired,
    quizEnabled: PropTypes.bool,
    streetsToDraw: PropTypes.array,
    setStreetsToDraw: PropTypes.func.isRequired,
    isDivisionsView: PropTypes.bool,
    setMarkers: PropTypes.func.isRequired,
    setPathData: PropTypes.func.isRequired,
    setViewState: PropTypes.func.isRequired,
    gameMode: PropTypes.string,
    setGameMode: PropTypes.func.isRequired,
    setOptimalPathData: PropTypes.func.isRequired,
    setQuizPathData: PropTypes.func.isRequired,
    navigationRef: PropTypes.object,
    setNavigationRef: PropTypes.func.isRequired,
};

export default ControlPanel;

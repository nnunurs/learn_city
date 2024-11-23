import { useEffect, useState } from "react";
import { FaFlag } from "react-icons/fa";
import { Login } from "./Login";
import Quiz from "./Quiz";
import PropTypes from "prop-types";
import CityPicker from "./CityPicker";

function ControlPanel({
    getRandomStreet,
    visible,
    hovered,
    name,
    division,
    focusOnStreet,
    enableDivisionsView,
    currentStreet,
    streets,
    userRef,
    setUserRef,
    quizEnabled,
    streetsToDraw,
    setStreetsToDraw,
    isDivisionsView
}) {
    useEffect(() => {
        console.log(quizEnabled, division, streets, currentStreet)
    }, [quizEnabled]);

    return (
        <div className="glass right-5 top-5 z-10 m-5 flex w-screen flex-col rounded-md p-4 md:w-fit lg:w-fit">
            {visible && hovered && (
                <div
                    className="glass fixed z-10 rounded-md p-2 text-lg"
                    style={{
                        left: hovered.x + 20,
                        top: hovered.y + 20,
                        pointerEvents: "none",
                    }}
                >
                    {name}
                </div>
            )}
            <div className="flex flex-col gap-2">
                {!userRef && (
                    <div className="flex flex-col gap-2">
                        <p className="text-center">Zaloguj sie by zagrać</p>
                        <Login setUserRef={setUserRef}>
                            {(onOpen) => (
                                <button
                                    className="btn shadow-sm"
                                    onClick={onOpen}
                                >
                                    Zaloguj
                                </button>
                            )}
                        </Login>
                    </div>
                )}
                {userRef && (
                    <p className="font-bold text-xl">
                        {!isDivisionsView
                            ? division
                                .split("_")
                                .map(
                                    (word) =>
                                        word.charAt(0).toUpperCase() + word.slice(1),
                                )
                                .join(" ")
                            : "Wybierz dzielnicę"}
                    </p>)}
                {quizEnabled && (<div className="flex justify-center gap-4">
                    <button
                        className="btn shadow-sm"
                        onClick={focusOnStreet}
                        title="Wróc do ulicy"
                    >
                        <FaFlag />
                    </button>
                    <button
                        className="btn shadow-sm"
                        onClick={enableDivisionsView}
                        title="Zmień dzielnicę"
                    >
                        Zmień dzielnicę
                    </button>
                    <Login setUserRef={setUserRef} />
                </div>
                )}
                {quizEnabled && division && streets && currentStreet && (
                    <Quiz
                        correct={currentStreet[0].name}
                        streets={streets}
                        streetsToDraw={streetsToDraw}
                        setStreetsToDraw={setStreetsToDraw}
                        newStreet={getRandomStreet}
                        division={division}
                        userRef={userRef}
                    />
                )}
            </div>
        </div>
    );
}

ControlPanel.propTypes = {
    cleanCookies: PropTypes.func.isRequired,
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
    currentStreet: PropTypes.array,
    streets: PropTypes.object,
    userRef: PropTypes.string,
    setUserRef: PropTypes.func.isRequired,
    quizEnabled: PropTypes.bool.isRequired,
    streetsToDraw: PropTypes.array.isRequired,
    setStreetsToDraw: PropTypes.func.isRequired
};

export default ControlPanel;

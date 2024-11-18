import { useContext, useState } from "react";
import {
    Button,
    Text,
    Slider,
    SliderFilledTrack,
    SliderMark,
    SliderThumb,
    SliderTrack,
} from "@chakra-ui/react";
import { FaFlag } from "react-icons/fa";
import { Login } from "./Login";
import Quiz from "./Quiz";
import MapContext from "../context/MapContext";
import PropTypes from "prop-types";
import CityPicker from "./CityPicker";

function ControlPanel({ cleanCookies, getRandomStreet, onSaveRadius }) {
    const {
        division,
        city,
        setCity,
        focusOnStreet,
        enableDivisionsView,
        currentStreet,
        streets,
        userRef,
        setUserRef,
        quizEnabled,
        streetsToDraw,
        setStreetsToDraw,
    } = useContext(MapContext);

    return (
        <div className="glass right-5 top-5 z-10 m-5 flex w-screen flex-col rounded-md p-4 md:w-fit lg:w-fit">
            <div className="flex flex-col gap-2">
                <Text fontSize="xl" fontWeight="bold">
                    {division
                        .split("_")
                        .map(
                            (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                </Text>
                <div className="flex justify-center gap-4">
                    <button
                        className="btn shadow-sm"
                        onClick={focusOnStreet}
                        title="Wróc do ulicy"
                    >
                        <FaFlag />
                    </button>
                    <button
                        className="btn shadow-sm"
                        type="button"
                        onClick={() => {
                            console.log('Przycisk kliknięty');
                            if (enableDivisionsView) {
                                enableDivisionsView();
                            } else {
                                console.log('enableDivisionsView jest undefined!');
                            }
                        }}
                    >
                        Zmień dzielnicę
                    </button>
                    <Login setUserRef={setUserRef} />
                </div>
                <div className="flex justify-center">
                    <button
                        className="btn mr-4 shadow-sm"
                        type="button"
                        onClick={() =>
                            setCity(city === "krakow" ? "zakopane" : "krakow")
                        }
                    >
                        {city === "krakow" ? "Zakopane" : "Kraków"}
                    </button>
                    <button
                        className="btn"
                        type="button"
                        onClick={cleanCookies}
                    >
                        Zresetuj postępy
                    </button>
                </div>
                <CityPicker />
                {!userRef && "Zaloguj się aby zacząć się uczyć!"}
                {quizEnabled && userRef && (
                    <Quiz
                        correct={currentStreet[0].name}
                        streets={streets}
                        newStreet={getRandomStreet}
                        city={city}
                        division={division}
                        userRef={userRef}
                        streetsToDraw={streetsToDraw}
                        setStreetsToDraw={setStreetsToDraw}
                    />
                )}
            </div>
        </div>
    );
}

ControlPanel.propTypes = {
    cleanCookies: PropTypes.func.isRequired,
    getRandomStreet: PropTypes.func.isRequired,
    onSaveRadius: PropTypes.func.isRequired,
};

export default ControlPanel;

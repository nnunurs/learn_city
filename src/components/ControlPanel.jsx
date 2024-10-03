import { useContext } from "react";
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
        radiusEnabled,
        setRadiusEnabled,
        radius,
        setRadius,
    } = useContext(MapContext);

    return (
        <div className="glass right-5 top-5 z-10 m-5 flex w-screen flex-col rounded-md p-4 md:w-fit lg:w-fit">
            {radiusEnabled ? (
                <div className="align-center flex flex-col justify-center">
                    <Text fontSize="xl" fontWeight="bold">
                        Ustaw promień
                    </Text>
                    <Slider
                        className="mt-10"
                        defaultValue={radius}
                        min={500}
                        max={8000}
                        step={50}
                        onChange={(val) => setRadius(val)}
                    >
                        <SliderMark
                            value={radius}
                            textAlign="center"
                            bg="blue.500"
                            color="white"
                            mt="-10"
                            ml="-5"
                            w="15"
                        >
                            {(radius / 1000).toFixed(2)}km
                        </SliderMark>
                        <SliderTrack>
                            <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                    </Slider>
                    <Button
                        className="mt-3"
                        type="button"
                        onClick={() => setRadiusEnabled(false)}
                    >
                        Anuluj
                    </Button>
                    <Button
                        className="mt-3"
                        type="button"
                        onClick={onSaveRadius}
                    >
                        Zapisz
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <Text fontSize="xl" fontWeight="bold">
                        {division
                            .split("_")
                            .map(
                                (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1),
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
                            onClick={enableDivisionsView}
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
                                setCity(
                                    city === "krakow" ? "zakopane" : "krakow",
                                )
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
            )}
        </div>
    );
}

ControlPanel.propTypes = {
    cleanCookies: PropTypes.func.isRequired,
    getRandomStreet: PropTypes.func.isRequired,
    onSaveRadius: PropTypes.func.isRequired,
};

export default ControlPanel;

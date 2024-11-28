/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import {
  filterObj,
  findIndexByName,
  keywordBasedFilter,
} from "../scripts/scripts";

import { db } from "../config/firebase";
import {
  addDoc,
  and,
  collection,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { FaFlag } from "react-icons/fa";
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }
  return array;
};

const getPercentage = (part, full) => {
  return Math.round((part / full) * 100).toString() + "%";
};

const getRandomStreet = (streets) => {
  if (!streets || Object.keys(streets).length === 0) {
    return "";
  }
  const random_street_key =
    Object.keys(streets)[
    Math.floor(Math.random() * Object.keys(streets).length)
    ];

  console.log(streets[random_street_key][0].name);
  return streets[random_street_key][0].name;
};

const Quiz = ({
  correct,
  streets,
  newStreet,
  streetsToDraw,
  setStreetsToDraw,
  division,
  userRef,
  focusOnStreet,
}) => {
  // Early return if any required props are missing
  if (!correct || !streets || correct === "loading") {
    console.log("Quiz requires all props to be defined:", { correct, streets });
    return null;
  }

  const [options, setOptions] = useState(["option1", "option2", "option3"]);
  const [stats, setStats] = useState({
    wellKnown: 0,
    known: 0,
    almostKnown: 0,
    unknown: 0,
  });
  const [checked, setChecked] = useState(false);
  const [caption, setCaption] = useState(
    "Ta ulica jeszcze nie była przez ciebie zgadywana",
  );
  const [isConfettiRunning, setIsConfettiRunning] = useState(false);

  // Initialize cookies if they don't exist
  const newOptions = (availableOptions) => {
    if (!availableOptions || !correct) {
      setOptions([]);
      return;
    }

    console.log("refreshing options", correct);
    const filteredOptions1 = filterObj(availableOptions, (e) => e[0].name !== correct);
    if (Object.keys(filteredOptions1).length === 0) {
      setOptions([correct]);
      return;
    }

    const option1 = getRandomStreet(filteredOptions1);

    const filteredOptions2 = filterObj(
      availableOptions,
      (e) => e[0].name !== correct && e[0].name !== option1
    );

    if (Object.keys(filteredOptions2).length === 0) {
      setOptions(shuffle([correct, option1]));
      return;
    }

    const option2 = getRandomStreet(filteredOptions2);
    setOptions(shuffle([correct, option1, option2]));
  };

  const checkAnswer = async (option) => {
    if (!correct) {
      console.log("Missing required data for checking answer:", { division });
      return;
    }

    // Resetuj konfetti przed sprawdzeniem nowej odpowiedzi
    setIsConfettiRunning(false);


    //TODO optimize the amount of db reading
    const streetsRef = collection(db, "users", userRef, "streets");
    console.log("ref", userRef);
    const q = query(
      streetsRef,
      and(where("name", "==", correct), where("division", "==", division)),
    );
    const querySnapshot = await getDocs(q);

    if (option === correct) {
      setIsConfettiRunning(true);
      if (querySnapshot.empty) {
        await addDoc(streetsRef, {
          name: correct,
          division: division,
          count: 1,
        });
      } else {
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            count: doc.data().count === -1 ? 1 : doc.data().count + 1,
          });
        });
      }
      console.log("correct");
    } else {
      if (querySnapshot.empty) {
        await addDoc(streetsRef, {
          name: correct,
          division: division,
          count: -1,
        });
      } else {
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            count: doc.data().count === 1 ? -1 : 0,
          });
        });
      }
      console.log("wrong");
    }

    setChecked(true);
    setTimeout(() => {
      newStreet();
      setChecked(false);
      // Upewnij się, że konfetti zostanie zatrzymane po zmianie pytania
      // setIsConfettiRunning(false);
    }, 1000);
  };

  useEffect(() => {
    if (!userRef || !correct || !division || !streets) {
      console.log("Missing required data for options:", { userRef, correct, division, streets });
      return;
    }

    if (streetsToDraw.map((e) => e.name).includes(correct)) {
      const count =
        streetsToDraw[findIndexByName(streetsToDraw, correct)].count;
      const tempCaption =
        count > 0
          ? `Poprawne odpowiedzi: ${count}`
          : `Niepoprawne odpowiedzi: ${count * -1}`;
      setCaption(tempCaption);
    } else {
      setCaption("Ta ulica jeszcze nie była przez ciebie zgadywana");
    }

    newOptions(
      keywordBasedFilter(
        correct,
        ["rondo", "skwer", "plac", "bulwar", "aleja", "droga", "most"],
        streets,
      ),
    );
  }, [correct, division, streets, userRef]);

  const getStreetsToDraw = (querySnapshot) => {
    let tempStats = { wellKnown: 0, known: 0, almostKnown: 0, unknown: 0 };
    let tempStreetsToDraw = [];
    querySnapshot.forEach((doc) => {
      if (streets[doc.data().name]) {
        switch (true) {
          case doc.data().count > 2:
            tempStats = {
              ...tempStats,
              wellKnown: tempStats.wellKnown + 1,
            };
            tempStreetsToDraw = [
              ...tempStreetsToDraw,
              ...streets[doc.data().name].map((e) => ({
                ...e,
                count: doc.data().count,
                color: "darkgreen",
              })),
            ];
            break;
          case doc.data().count === 2:
            tempStats = {
              ...tempStats,
              known: tempStats.known + 1,
            };
            tempStreetsToDraw = [
              ...tempStreetsToDraw,
              ...streets[doc.data().name].map((e) => ({
                ...e,
                count: doc.data().count,
                color: "green",
              })),
            ];
            break;
          case doc.data().count === 1:
            tempStats = {
              ...tempStats,
              almostKnown: tempStats.almostKnown + 1,
            };
            tempStreetsToDraw = [
              ...tempStreetsToDraw,
              ...streets[doc.data().name].map((e) => ({
                ...e,
                count: doc.data().count,
                color: "yellow",
              })),
            ];
            break;
          case doc.data().count < 1:
            tempStats = {
              ...tempStats,
              unknown: tempStats.unknown + 1,
            };
            tempStreetsToDraw = [
              ...tempStreetsToDraw,
              ...streets[doc.data().name].map((e) => ({
                ...e,
                count: doc.data().count,
                color: "red",
              })),
            ];
            break;
        }
      }
    });
    setStats(tempStats);
    setStreetsToDraw(tempStreetsToDraw);
  };

  useEffect(() => {
    if (userRef) {
      const q = query(
        collection(db, "users", userRef, "streets"),
        where("division", "==", division),
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        getStreetsToDraw(querySnapshot);
      });
      return () => unsubscribe();
    } else {
      setStats({
        wellKnown: 0,
        known: 0,
        almostKnown: 0,
        unknown: 0,
      });
      setStreetsToDraw([]);
    }
  }, [division, userRef]);

  useEffect(() => {
    console.log(stats);
  }, [stats]);

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence>
        {isConfettiRunning && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            numberOfPieces={100}
            gravity={0.7}
            run={isConfettiRunning}
            recycle={false}
            onConfettiComplete={() => {
              setIsConfettiRunning(false);
            }}
          />
        )}
      </AnimatePresence>

      {userRef ? (
        <div className="flex flex-col gap-3 text-xl">
          <div className="btn transform transition-all duration-200 hover:scale-105"
            onClick={() => focusOnStreet()}>
            <FaFlag className="text-teal-500" />Wróć do ulicy
          </div>
          <div className="bg-teal-200 py-2 px-4 text-md rounded-md transform transition-all duration-300 hover:translate-x-2">
            Dobrze znam: {stats.wellKnown}
          </div>
          <div className="bg-green-200 py-2 px-4 text-md rounded-md transform transition-all duration-300 hover:translate-x-2">
            Znam: {stats.known}
          </div>
          <div className="bg-orange-200 py-2 px-4 text-md rounded-md transform transition-all duration-300 hover:translate-x-2">
            Jeszcze się uczę: {stats.almostKnown}
          </div>
          <div className="bg-red-300 py-2 px-4 text-md rounded-md transform transition-all duration-300 hover:translate-x-2">
            Nie znam: {stats.unknown}
          </div>
          <div className="bg-slate-200 py-2 px-4 text-md rounded-md transform transition-all duration-300 hover:translate-x-2">
            Jeszcze nieodkryte:{" "}
            {streets && Object.keys(streets).length > 0
              ? Object.keys(streets).length -
              (stats.wellKnown +
                stats.known +
                stats.almostKnown +
                stats.unknown)
              : 0}
          </div>
        </div>
      ) : (
        <div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-lg mt-4 mb-2 mx-2 font-bold">Co to za ulica?</p>
        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => checkAnswer(option)}
              className={
                "btn flex justify-start " +
                (option === correct && checked
                  ? "bg-green-400 hover:bg-green-400"
                  : checked
                    ? "bg-red-400 hover:bg-red-400"
                    : "")
              }
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz;

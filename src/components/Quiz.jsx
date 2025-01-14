/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
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
import { FaFlag, FaSearch, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import Fuse from 'fuse.js';

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
  isHardMode = false
}) => {
  // Early return if any required props are missing
  if (!correct || !streets || !userRef || correct === "loading") {
    console.log("Quiz waiting for initialization...", { correct, streets, userRef });
    return (
      <div className="flex items-center justify-center p-4">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  const [options, setOptions] = useState([]);
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const fuseRef = useRef(null);
  const inputRef = useRef(null);
  const listenerRef = useRef(null);
  const isInitialMount = useRef(true);
  const previousDivision = useRef(division);

  // Initialize Fuse.js for hardmode
  useEffect(() => {
    if (streets && Object.keys(streets).length > 0) {
      const options = {
        includeScore: true,
        threshold: 0.4,
        keys: ['0.name']
      };
      fuseRef.current = new Fuse(Object.values(streets), options);
    }
  }, [streets]);

  // Handle search input for hardmode
  const handleSearch = (value) => {
    setSearchInput(value);
    if (!value.trim() || !fuseRef.current) {
      setSearchResults([]);
      return;
    }
    const results = fuseRef.current.search(value).slice(0, 5);
    setSearchResults(results);
  };

  // Handle keyboard navigation for hardmode
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      checkAnswer(searchResults[0].item[0].name);
      setSearchInput("");
      setSearchResults([]);
    }
  };

  // Initialize options when component mounts or when dependencies change
  useEffect(() => {
    if (!streets || !correct || Object.keys(streets).length === 0) {
      console.log("No streets data available for options");
      setOptions([]);
      return;
    }

    console.log("Initializing options with correct street:", correct);
    const availableOptions = keywordBasedFilter(
      correct,
      ["rondo", "skwer", "plac", "bulwar", "aleja", "droga", "most"],
      streets,
    );

    if (!availableOptions || Object.keys(availableOptions).length === 0) {
      console.log("No available options found");
      setOptions([correct]);
      return;
    }

    const newOptions = generateOptions(availableOptions, correct);
    setOptions(newOptions);
    setIsInitialized(true);
  }, [correct, streets]);

  // Helper function to generate options
  const generateOptions = (availableOptions, correctAnswer) => {
    const filteredOptions1 = filterObj(availableOptions, (e) => e[0].name !== correctAnswer);
    if (Object.keys(filteredOptions1).length === 0) {
      return [correctAnswer];
    }

    const option1 = getRandomStreet(filteredOptions1);
    const filteredOptions2 = filterObj(
      availableOptions,
      (e) => e[0].name !== correctAnswer && e[0].name !== option1
    );

    if (Object.keys(filteredOptions2).length === 0) {
      return shuffle([correctAnswer, option1]);
    }

    const option2 = getRandomStreet(filteredOptions2);
    return shuffle([correctAnswer, option1, option2]);
  };

  const checkAnswer = async (option) => {
    if (!correct) {
      console.log("Missing required data for checking answer:", { division });
      return;
    }

    setIsConfettiRunning(false);
    const isCorrect = option.toLowerCase() === correct.toLowerCase();

    if (isHardMode) {
      if (isCorrect) {
        setIsConfettiRunning(true);
        const newStreak = streak + 1;
        setStreak(newStreak);
        setHighScore(Math.max(highScore, newStreak));
        // Zapisz highscore do Firebase
        const statsCollection = collection(db, "users", userRef, "stats");
        const statsDoc = await getDocs(query(statsCollection, where("type", "==", "quiz_hardmode")));
        if (statsDoc.empty) {
          await addDoc(statsCollection, {
            type: "quiz_hardmode",
            highScore: Math.max(highScore, newStreak)
          });
        } else {
          statsDoc.forEach(async (doc) => {
            if (Math.max(highScore, newStreak) > doc.data().highScore) {
              await updateDoc(doc.ref, {
                highScore: Math.max(highScore, newStreak)
              });
            }
          });
        }
        // Pokazujemy feedback i zmieniamy ulicę po krótkim opóźnieniu
        setChecked(true);
        setTimeout(() => {
          newStreet();
          setChecked(false);
          setSearchInput("");
          setSearchResults([]);
          // Dodajemy małe opóźnienie dla focusu, aby input był już aktywny
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 50);
        }, 1000);
      } else {
        setStreak(0);
        // Pokazujemy feedback dla błędnej odpowiedzi
        setChecked(true);
        setTimeout(() => {
          setChecked(false);
          setSearchInput("");
          setSearchResults([]);
          // Dodajemy małe opóźnienie dla focusu, aby input był już aktywny
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 50);
        }, 1000);
      }
    } else {
      const streetsRef = collection(db, "users", userRef, "streets");
      const q = query(
        streetsRef,
        and(where("name", "==", correct), where("division", "==", division)),
      );
      const querySnapshot = await getDocs(q);

      if (isCorrect) {
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
      }
    }

    setChecked(true);
    setTimeout(() => {
      newStreet();
      setChecked(false);
    }, 1000);
  };

  // Load highscore from Firebase
  useEffect(() => {
    if (isHardMode && userRef) {
      const loadHighScore = async () => {
        const statsRef = collection(db, "users", userRef, "stats");
        const statsDoc = await getDocs(query(statsRef, where("type", "==", "quiz_hardmode")));
        if (!statsDoc.empty) {
          statsDoc.forEach((doc) => {
            setHighScore(doc.data().highScore || 0);
          });
        }
      };
      loadHighScore();
    }
  }, [isHardMode, userRef]);

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
  }, [correct, division, streets, userRef]);

  const getStreetsToDraw = (querySnapshot) => {
    console.log("Processing Firestore data");
    let tempStats = { wellKnown: 0, known: 0, almostKnown: 0, unknown: 0 };
    let tempStreetsToDraw = [];
    querySnapshot.forEach((doc) => {
      console.log("Processing street:", doc.data().name, "count:", doc.data().count);
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

  // Effect for handling Firestore listener
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;
    console.log("Quiz useEffect - setup listener");

    const setupFirestoreListener = async () => {
      if (!userRef || !division) return;

      console.log("Setting up Firestore listener for user:", userRef, "division:", division);

      const q = query(
        collection(db, "users", userRef, "streets"),
        where("division", "==", division),
      );

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (isMounted) {
          console.log("Firestore update received, docs:", querySnapshot.size);
          console.log("Filtered documents:", querySnapshot.docs.map(doc => ({
            name: doc.data().name,
            division: doc.data().division,
            count: doc.data().count
          })));
          getStreetsToDraw(querySnapshot);
        }
      }, (error) => {
        console.error("Firestore listener error:", error);
      });
    };

    if (userRef && division) {
      console.log("Setting up new listener for division:", division);
      setupFirestoreListener();
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        console.log("Cleaning up Firestore listener for division:", division);
        unsubscribe();
      }
    };
  }, [userRef, division]);

  // Reset stats when no data is available
  useEffect(() => {
    if (!userRef || !division) {
      console.log("No userRef or division, resetting stats");
      setStats({
        wellKnown: 0,
        known: 0,
        almostKnown: 0,
        unknown: 0,
      });
      setStreetsToDraw([]);
    }
  }, [userRef, division]);

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
            gravity={0.5}
            run={isConfettiRunning}
            recycle={false}
            onConfettiComplete={() => {
              setIsConfettiRunning(false);
            }}
          />
        )}
      </AnimatePresence>

      {userRef && (
        <div className="flex flex-col gap-3 text-xl">
          <div className="btn transform transition-all duration-200 hover:scale-105"
            onClick={() => focusOnStreet()}>
            <FaFlag className="text-teal-500" />Wróć do ulicy
          </div>
          {isHardMode ? (
            <>
              <div className="bg-primary/20 text-primary py-2 px-4 text-md rounded-md">
                Streak: {streak}
              </div>
              <div className="bg-secondary/20 text-secondary py-2 px-4 text-md rounded-md">
                High Score: {highScore}
              </div>
            </>
          ) : (
            <>
              <div className="bg-teal-200 dark:bg-teal-700 dark:text-teal-100 py-2 px-4 text-md rounded-md transform transition-all duration-300 hover:translate-x-2">
                Dobrze znam: {stats.wellKnown}
              </div>
              <div className="bg-green-200 dark:bg-green-700 dark:text-green-100 py-2 px-4 text-md rounded-md transform transition-all duration-300 hover:translate-x-2">
                Znam: {stats.known}
              </div>
              <div className="bg-orange-200 dark:bg-orange-700 dark:text-orange-100 py-2 px-4 text-md rounded-md transform transition-all duration-300 hover:translate-x-2">
                Jeszcze się uczę: {stats.almostKnown}
              </div>
              <div className="bg-red-300 dark:bg-red-700 dark:text-red-100 py-2 px-4 text-md rounded-md transform transition-all duration-300 hover:translate-x-2">
                Nie znam: {stats.unknown}
              </div>
              <div className="bg-slate-200 dark:bg-slate-700 dark:text-slate-100 py-2 px-4 text-md rounded-md transform transition-all duration-300 hover:translate-x-2">
                Jeszcze nieodkryte:{" "}
                {streets && Object.keys(streets).length > 0
                  ? Object.keys(streets).length -
                  (stats.wellKnown +
                    stats.known +
                    stats.almostKnown +
                    stats.unknown)
                  : 0}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-lg mt-4 mb-2 mx-2 font-bold">Co to za ulica?</p>
        {isHardMode ? (
          <div className="form-control">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Wpisz nazwę ulicy..."
                className={`input input-bordered w-full pl-10 pr-10 ${checked && 'input-disabled'}`}
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={checked}
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60 w-4 h-4" />
              {searchInput && !checked && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content p-1"
                  onClick={() => {
                    setSearchInput("");
                    setSearchResults([]);
                  }}
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchResults.length > 0 && !checked && (
              <div className="mt-2 bg-base-200 rounded-lg overflow-hidden">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    className={`w-full px-4 py-2 text-left hover:bg-base-300 flex justify-between items-center`}
                    onClick={() => {
                      checkAnswer(result.item[0].name);
                      setSearchInput("");
                      setSearchResults([]);
                    }}
                  >
                    <span>{result.item[0].name}</span>
                    <span className="text-xs opacity-60">
                      {Math.round((1 - result.score) * 100)}% match
                    </span>
                  </button>
                ))}
              </div>
            )}
            {checked && (
              <div className={`alert mt-2 ${isConfettiRunning ? 'alert-success' : 'alert-error'}`}>
                <span>{isConfettiRunning ? 'Poprawna odpowiedź!' : `Niepoprawna odpowiedź. Prawidłowa nazwa to: ${correct}`}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => checkAnswer(option)}
                className={
                  "btn flex justify-start " +
                  (option === correct && checked
                    ? "bg-green-400 hover:bg-green-400 dark:bg-green-600 dark:hover:bg-green-600 dark:text-green-100"
                    : checked
                      ? "bg-red-400 hover:bg-red-400 dark:bg-red-600 dark:hover:bg-red-600 dark:text-red-100"
                      : "")
                }
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;

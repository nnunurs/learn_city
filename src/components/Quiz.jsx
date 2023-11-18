/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

import { Button, Tag } from "@chakra-ui/react";
import filterObj from "../scripts/scripts";

import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

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
  city,
  division,
  userRef,
  streetsToDraw,
  setStreetsToDraw,
}) => {
  const [options, setOptions] = useState(["option1", "option2", "option3"]);
  const [stats, setStats] = useState({
    wellKnown: 0,
    known: 0,
    almostKnown: 0,
    unknown: 0,
  });
  const [cookies, setCookie] = useCookies(["score"]);
  const [checked, setChecked] = useState(false);

  const newOptions = (availableOptions) => {
    console.log("refreshing options", correct);
    const option1 = getRandomStreet(
      filterObj(availableOptions, (e) => e[0].name !== correct)
    );
    const option2 = getRandomStreet(
      filterObj(
        availableOptions,
        (e) => e[0].name !== correct && e[0].name !== option1
      )
    );

    setOptions(shuffle([correct, option1, option2]));
  };

  const checkAnswer = async (option) => {
    const streetsRef = collection(db, "users", userRef, "streets");
    console.log("ref", userRef);
    const q = query(streetsRef, where("name", "==", correct));
    const querySnapshot = await getDocs(q);

    if (option === correct) {
      setCookie("score", {
        ...cookies.score,
        [city]: {
          ...cookies.score[city],
          [division]: {
            ...cookies.score[city][division],
            correct: cookies.score[city][division].correct + 1,
            known: [...cookies.score[city][division].known, correct],
          },
        },
      });

      if (querySnapshot.empty) {
        await addDoc(streetsRef, {
          name: correct,
          division: division,
          count: 1,
        });
      } else {
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, { count: doc.data().count + 1 });
        });
      }
      console.log("correct");
    } else {
      setCookie("score", {
        ...cookies.score,
        [city]: {
          ...cookies.score[city],
          [division]: {
            ...cookies.score[city][division],
            wrong: cookies.score[city][division].wrong + 1,
            mistakes: [...cookies.score[city][division].mistakes, correct],
          },
        },
      });

      if (querySnapshot.empty) {
        await addDoc(streetsRef, {
          name: correct,
          division: division,
          count: -1,
        });
      } else {
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, { count: doc.data().count - 1 });
        });
      }
      console.log("wrong");
    }

    setChecked(true);
    setTimeout(() => {
      newStreet();
      setChecked(false);
    }, 1000);
  };

  const keywordBasedFilter = (correct, keywords, obj) => {
    console.log("before filtering", obj);
    for (let i = 0; i < keywords.length; i++) {
      if (correct.toLowerCase().includes(keywords[i])) {
        const filtered = filterObj(
          obj,
          (e) =>
            e[0].name.toLowerCase().includes(keywords[i]) &&
            e[0].name !== correct
        );
        console.log("filtered", filtered);
        if (Object.keys(filtered).length < 2) {
          return obj;
        }
        return filtered;
      }
    }
    return obj;
  };

  useEffect(() => {
    newOptions(
      keywordBasedFilter(
        correct,
        ["rondo", "skwer", "plac", "bulwar", "aleja", "droga"],
        streets
      )
    );
    console.log(options);
  }, [correct]);

  useEffect(() => {
    const q = query(
      collection(db, "users", userRef, "streets"),
      where("division", "==", division)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let tempStats = { wellKnown: 0, known: 0, almostKnown: 0, unknown: 0 };
      let tempStreetsToDraw = [];
      querySnapshot.forEach((doc) => {
        console.log(doc.data());

        switch (true) {
          case doc.data().count > 2:
            console.log("well known");
            tempStats = {
              ...tempStats,
              wellKnown: tempStats.wellKnown + 1,
            };
            tempStreetsToDraw = [
              ...tempStreetsToDraw,
              ...streets[doc.data().name].map((e) => ({
                ...e,
                color: "darkgreen",
              })),
            ];
            break;
          case doc.data().count === 2:
            console.log("known");
            tempStats = {
              ...tempStats,
              known: tempStats.known + 1,
            };
            tempStreetsToDraw = [
              ...tempStreetsToDraw,
              ...streets[doc.data().name].map((e) => ({
                ...e,
                color: "green",
              })),
            ];
            break;
          case doc.data().count === 1:
            console.log("almost known");
            tempStats = {
              ...tempStats,
              almostKnown: tempStats.almostKnown + 1,
            };
            tempStreetsToDraw = [
              ...tempStreetsToDraw,
              ...streets[doc.data().name].map((e) => ({
                ...e,
                color: "yellow",
              })),
            ];
            break;
          case doc.data().count < 1:
            console.log("unknown");
            tempStats = {
              ...tempStats,
              unknown: tempStats.unknown + 1,
            };
            tempStreetsToDraw = [
              ...tempStreetsToDraw,
              ...streets[doc.data().name].map((e) => ({ ...e, color: "red" })),
            ];
            break;
        }
      });
      console.log(tempStats);
      setStats(tempStats);
      setStreetsToDraw(tempStreetsToDraw);
    });
    return () => unsubscribe();
  }, [division, userRef]);

  useEffect(() => {
    console.log(stats);
  }, [stats]);

  return (
    <div className="flex flex-col">
      {userRef ? (
        <div className="flex flex-col gap-3">
          <Tag size="lg" colorScheme="teal">
            Dobrze znam: {stats.wellKnown}
          </Tag>
          <Tag size="lg" colorScheme="green">
            Znam: {stats.known}
          </Tag>
          <Tag size="lg" colorScheme="orange">Jeszcze się uczę: {stats.almostKnown}</Tag>
          <Tag size="lg" colorScheme="red">Nie znam: {stats.unknown}</Tag>
        </div>
      ) : (
        <div>
          {cookies.score ? (
            cookies.score[city][division] ? (
              <div className="flex flex-col">
                <p>
                  Poprawne odpowiedzi:{" "}
                  {cookies.score ? cookies.score[city][division].correct : 0}
                </p>
                <p>
                  Błędne odpowiedzi:{" "}
                  {cookies.score ? cookies.score[city][division].wrong : 0}
                </p>
                <p>
                  Poznane ulice w tej dzielnicy:{" "}
                  {cookies.score
                    ? getPercentage(
                        cookies.score[city][division].known.length,
                        Object.keys(streets).length
                      )
                    : "0%"}
                </p>
              </div>
            ) : (
              "Zmienianie miasta..."
            )
          ) : (
            "Zmienianie miasta... Jeśli ta wiadomość się utrzymuje, zresetuj postępy."
          )}
        </div>
      )}

      {/* <button onClick={() => newOptions()}>New options</button> */}
      <div className="flex flex-col">
        {options.map((option, i) => {
          return (
            <Button
              key={i}
              type="button"
              onClick={() => checkAnswer(option)}
              colorScheme={
                option === correct && checked
                  ? "green"
                  : checked
                  ? "red"
                  : "gray"
              }
              className={"mt-3"}
            >
              {option}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default Quiz;

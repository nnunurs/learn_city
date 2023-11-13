/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

import { Button } from "@chakra-ui/react";
import filterObj from "../scripts/scripts";

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

function Quiz({ correct, streets, newStreet, city, division }) {
  const [options, setOptions] = useState(["option1", "option2", "option3"]);
  // const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [cookies, setCookie] = useCookies(["score"]);
  const [checked, setChecked] = useState(false);

  const newOptions = (availableOptions) => {
    console.log("refreshing options", correct);

    setOptions(
      shuffle([
        correct,
        getRandomStreet(availableOptions),
        getRandomStreet(availableOptions),
      ])
    );
  };

  const checkAnswer = (option) => {
    if (option === correct) {
      // setScore({ ...score, correct: score.correct + 1 });
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
      console.log("correct");
    } else {
      // setScore({ ...score, wrong: score.wrong + 1 });
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
      console.log("wrong");
    }

    // console.log(cookies.score[city].known.length, cookies.score[city].wrong);

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

  return (
    <div className="flex flex-col">
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
}

export default Quiz;

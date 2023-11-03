/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

import { Button } from "@chakra-ui/react";

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * i);

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

function Quiz({ correct, streets, newStreet, city }) {
  const [options, setOptions] = useState(["option1", "option2", "option3"]);
  // const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [cookies, setCookie] = useCookies(["score"]);
  const [checked, setChecked] = useState(false);

  const newOptions = () => {
    console.log("refreshing options", correct);

    setOptions(
      shuffle([correct, getRandomStreet(streets), getRandomStreet(streets)])
    );
  };

  const checkAnswer = (option) => {
    if (option === correct) {
      // setScore({ ...score, correct: score.correct + 1 });
      setCookie("score", {
        ...cookies.score,
        [city]: {
          ...cookies.score[city],
          correct: cookies.score[city].correct + 1,
          known: [...cookies.score[city].known, correct],
        },
      });
      console.log("correct");
    } else {
      // setScore({ ...score, wrong: score.wrong + 1 });
      setCookie("score", {
        ...cookies.score,
        [city]: {
          ...cookies.score[city],
          wrong: cookies.score[city].wrong + 1,
          mistakes: [...cookies.score[city].mistakes, correct],
        },
      });
      console.log("wrong");
    }

    console.log(cookies.score[city].known.length, cookies.score[city].wrong);

    setChecked(true);
    setTimeout(() => {
      newStreet();
      setChecked(false);
    }, 1000);
  };

  useEffect(() => {
    newOptions();
    console.log(options);
  }, [correct]);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <p>
          Poprawne odpowiedzi: {cookies.score ? cookies.score[city].correct : 0}
        </p>
        <p>
          Błędne odpowiedzi: {cookies.score ? cookies.score[city].wrong : 0}
        </p>
        <p>
          Znane ulice:{" "}
          {cookies.score
            ? getPercentage(
                cookies.score[city].known.length,
                Object.keys(streets).length
              )
            : "0%"}
        </p>
      </div>
      {/* <button onClick={() => newOptions()}>New options</button> */}
      <div className="flex flex-col m-5">
        {options.map((option) => {
          return (
            <Button
              key={option}
              type="button"
              onClick={() => checkAnswer(option)}
              className={
                (option === correct && checked
                  ? "bg-lime-500"
                  : checked
                  ? "bg-red-600"
                  : "") + " mt-3"
              }
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

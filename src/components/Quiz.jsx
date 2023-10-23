/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import streets from "../data/krakow_streets.json";

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * i);

    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }
  return array;
};

const getRandomStreet = (streets) => {
  const random_street_key =
    Object.keys(streets)[
      Math.floor(Math.random() * Object.keys(streets).length)
    ];

  console.log(streets[random_street_key][0].name);
  return streets[random_street_key][0].name;
};

function Quiz({ correct, newStreet }) {
  const [options, setOptions] = useState(["option1", "option2", "option3"]);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [checked, setChecked] = useState(false);

  const newOptions = () => {
    console.log("refreshing options", correct);

    setOptions(
      shuffle([correct, getRandomStreet(streets), getRandomStreet(streets)])
    );
  };

  const checkAnswer = (option) => {
    if (option === correct) {
      setScore({ ...score, correct: score.correct + 1 });
      console.log("correct");
    } else {
      setScore({ ...score, wrong: score.wrong + 1 });
      console.log("wrong");
    }

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
    <div className="flex ">
      <div className="">
        <p>Correct answers: {score.correct}</p>
        <p>Wrong answers: {score.wrong}</p>
      </div>
      {/* <button onClick={() => newOptions()}>New options</button> */}
      <div className="flex flex-col">
        {options.map((option) => {
          return (
            <button
              key={option}
              type="button"
              onClick={() => checkAnswer(option)}
              className={
                option === correct && checked
                  ? "bg-lime-500"
                  : checked
                  ? "bg-red-600"
                  : ""
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Quiz;

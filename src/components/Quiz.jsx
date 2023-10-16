/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import streets from "../data/out_with_shape.json";

const shuffle = (array) => {
  let currentIndex = array.length;

  for (let i = currentIndex; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * currentIndex);

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  console.log(array);
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

function Quiz({ correct }) {
  const [options, setOptions] = useState(["option1", "option2", "option3"]);

  const filterUndefined = (item) => {
    return item !== undefined;
  };

  const newOptions = () => {
    console.log("refreshing options", correct);

    setOptions(
      shuffle(
        [correct, getRandomStreet(streets), getRandomStreet(streets)].filter(
          filterUndefined
        )
      )
    );
  };

  const checkAnswer = (option) => {
    if (option === correct) {
      console.log("correct");
    } else {
      console.log("wrong");
    }
  };

  useEffect(() => {
    newOptions();
    console.log(options);
  }, [correct]);

  return (
    <div>
      <button onClick={() => newOptions()}>New options</button>
      {options.map((option) => {
        return (
          <button
            key={option}
            type="button"
            onClick={() => checkAnswer(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default Quiz;

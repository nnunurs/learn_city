export const filterObj = (obj, predicate) => {
  if (!obj) return {};
  const asArray = Object.entries(obj);
  const filtered = asArray.filter(([, value]) => predicate(value));
  return Object.fromEntries(filtered);
};

export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export const findIndexByName = (arr, item) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].name === item) {
      return i;
    }
  }
  return -1;
};

export const weightedRandom = (items, weights) => {
  if (items.length !== weights.length) {
    throw new Error("Items and weights must be of the same size");
  }

  if (!items.length) {
    throw new Error("Items must not be empty");
  }

  const cumulativeWeights = [];
  for (let i = 0; i < weights.length; i += 1) {
    cumulativeWeights[i] = weights[i] + (cumulativeWeights[i - 1] || 0);
  }

  const maxCumulativeWeight = cumulativeWeights[cumulativeWeights.length - 1];
  const randomNumber = maxCumulativeWeight * Math.random();

  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    if (cumulativeWeights[itemIndex] >= randomNumber) {
      return {
        item: items[itemIndex],
        index: itemIndex,
      };
    }
  }
};

export const keywordBasedFilter = (correct, keywords, obj) => {
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


export const getErrorMessages = (error) => {
  switch (error) {
    case "auth/email-already-in-use":
      return "Adres email jest już używany";
    case "auth/invalid-email":
      return "Niepoprawny adres email";
    case "auth/operation-not-allowed":
      return "Niedozwolona operacja";
    case "auth/weak-password":
      return "Hasło za słabe";
    case "auth/invalid-login-credentials":
      return "Niepoprawny login lub hasło";
    default:
      return "Coś poszło nie tak";
  }
}
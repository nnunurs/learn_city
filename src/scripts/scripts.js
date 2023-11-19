export const filterObj = (obj, predicate) => {
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

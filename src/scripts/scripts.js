const filterObj = (obj, predicate) => {
  const asArray = Object.entries(obj);
  const filtered = asArray.filter(([, value]) => predicate(value));
  return Object.fromEntries(filtered);
};

export default filterObj;

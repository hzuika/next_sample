export const isEven = <T>(array: T[]) => {
  return array.length % 2 === 0;
};

export const shuffle = <T>(array: T[]) => {
  return array.toSorted(() => Math.random() - 0.5);
};

export const makeId = () => {
  return crypto.randomUUID();
};

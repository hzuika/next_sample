export const isEven = <T>(array: T[]) => {
  return array.length % 2 === 0;
};

export const shuffle = <T>(array: T[]) => {
  return array.toSorted(() => Math.random() - 0.5);
};

export const isEmpty = (array: { length: number }) => {
  return array.length <= 0;
};

export const makeId = () => {
  return crypto.randomUUID();
};

export const makeSequentialArray = (length: number) => {
  return [...Array(length)].map((_, index) => index);
};

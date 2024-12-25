const isPlayer = (arg: any): arg is Player => {
  return (
    typeof arg === "object" &&
    Object.keys(arg).length === 2 &&
    typeof arg.id === "number" &&
    typeof arg.name === "string"
  );
};

export const isPlayers = (arg: any): arg is Player[] => {
  return Array.isArray(arg) && arg.every(isPlayer);
};

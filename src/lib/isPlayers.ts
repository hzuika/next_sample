const isPlayer = (arg: unknown): arg is Player => {
  const record = arg as Record<keyof Player, unknown>;
  return typeof record.id === "number" && typeof record.name === "string";
};

export const isPlayers = (arg: unknown): arg is Player[] => {
  return Array.isArray(arg) && arg.every(isPlayer);
};

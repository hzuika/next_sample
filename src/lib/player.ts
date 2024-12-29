import { isEmpty, makeId } from "./util";

const isPlayer = (arg: unknown): arg is Player => {
  const record = arg as Record<keyof Player, unknown>;
  return typeof record.id === "string" && typeof record.name === "string";
};

export const isPlayers = (arg: unknown): arg is Player[] => {
  return Array.isArray(arg) && arg.every(isPlayer);
};

export const GHOST_PLAYER: Player = { name: "不在", id: makeId() as PlayerId };

const hasDuplicatedPlayerName = (name: string, players: Player[]) => {
  let i = 0;
  players.forEach((player) => {
    if (player.name === name) {
      i += 1;
    }
  });
  return i > 1;
};

export const isValidPlayerName = (
  name: string,
  players: Player[]
): NameValidation => {
  if (isEmpty(name)) {
    return "empty";
  }
  if (hasDuplicatedPlayerName(name, players)) {
    return "duplicated";
  }
  return "valid";
};

export const getHelperTextForNameValidation = (
  name: string,
  players: Player[]
) => {
  switch (isValidPlayerName(name, players)) {
    case "duplicated":
      return "すでに使用されています";
    case "empty":
      return "";
    case "valid":
      return "";
  }
};

export const findPlayerById = (id: PlayerId, players: Player[]) => {
  return players.find((player) => player.id === id);
};

export const getPlayerName = (id: PlayerId, players: Player[]) => {
  const player = findPlayerById(id, players);
  if (player) {
    return player.name;
  } else {
    return "";
  }
};

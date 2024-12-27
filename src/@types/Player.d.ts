declare type PlayerId = Id<string, "Player">;
declare type NameValidation = "valid" | "empty" | "duplicated";
declare type Player = {
  name: string;
  readonly id: PlayerId;
};

declare type PlayerId = Id<string, "Player">;
declare type Player = {
  name: string;
  readonly id: PlayerId;
};

declare type Winner = "left" | "right" | "none";
declare type PairId = Id<string, "Pair">;
declare type MatchId = Id<string, "Match">;

declare type Pair = {
  left: PlayerId;
  right: PlayerId;
  winner: Winner;
  readonly id: PairId;
};

declare type Match = {
  pairList: Pair[];
  readonly id: MatchId;
};

declare type IndexPair = [left: number, right: number];

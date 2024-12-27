declare type Pair = {
  leftPlayerID: string;
  rightPlayerID: string;
  winnerID: string;
  readonly id: string;
};

declare type Match = {
  pairList: Pair[];
  readonly id: string;
};

declare type IndexPair = [left: number, right: number];
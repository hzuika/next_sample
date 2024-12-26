declare type Pair = {
  leftPlayerID: string;
  rightPlayerID: string;
  readonly id: string;
};

declare type Match = {
  pairList: Pair[];
  readonly id: string;
};

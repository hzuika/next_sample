// 配列の要素数を引数にとって、Round Robin Tournament の組み合わせの配列を返す.
export const roundRobin = (length: number) => {
  // Round Robin Tournament.
  // 0 1 2
  // 5 4 3
  // ↓
  // 0 5 1
  // 4 3 2
  // ↓
  // 0 4 5
  // 3 2 1
  // ↓
  // 0 3 4
  // 2 1 5
  // ↓
  // 0 2 3
  // 1 5 4

  console.assert(length % 2 === 0 && length > 1);

  // 連番の配列を作成.
  const array = [...Array(length)].map((_, index) => index);

  // シャッフル.
  array.sort(() => Math.random() - 0.5);

  const matchCount = Math.ceil(array.length / 2);
  const tournamentCount = array.length - 1;
  const tournament: IndexPair[][] = [];
  for (
    let tournamentIndex = 0;
    tournamentIndex < tournamentCount;
    ++tournamentIndex
  ) {
    const match: IndexPair[] = [];
    for (let matchIndex = 0; matchIndex < matchCount; ++matchIndex) {
      const left = array[matchIndex];
      const right = array[array.length - (matchIndex + 1)];
      match.push([left, right]);
    }
    tournament.push(match);

    // 最後の要素を1番目に持ってくる.
    if (array.length > 3) {
      const last = array.splice(array.length - 1, 1);
      array.splice(1, 0, last[0]);
    }
  }
  return tournament;
};

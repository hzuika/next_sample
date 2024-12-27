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
  //
  // 0が固定されるので、配列は以下のようにする。
  // 3, 2
  // 4, 1
  // 5, 0 (Ghost Player)

  console.assert(length % 2 === 0 && length > 1);

  // 連番の配列を作成.
  const indices = [...Array(length)].map((_, index) => index);

  const matchCount = Math.ceil(indices.length / 2);
  const tournamentCount = indices.length - 1;
  const tournament: IndexPair[][] = [];
  for (
    let tournamentIndex = 0;
    tournamentIndex < tournamentCount;
    ++tournamentIndex
  ) {
    const match: IndexPair[] = [];
    for (let matchIndex = 0; matchIndex < matchCount; ++matchIndex) {
      const leftIndex = matchCount + matchIndex;
      const rightIndex = matchCount - matchIndex - 1;

      if (leftIndex < 0 && leftIndex >= indices.length) {
        throw new Error(`配列の範囲外アクセス left ${leftIndex} in ${indices}`);
      }
      if (rightIndex < 0 && rightIndex >= indices.length) {
        throw new Error(
          `配列の範囲外アクセス right ${rightIndex} in ${indices}`
        );
      }

      const left = indices[leftIndex];
      const right = indices[rightIndex];
      match.push([left, right]);
    }
    tournament.push(match);

    // 最後の要素を1番目に持ってくる.
    if (indices.length > 3) {
      const last = indices.splice(indices.length - 1, 1);
      indices.splice(1, 0, last[0]);
    }
  }
  return tournament;
};

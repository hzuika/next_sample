import { getOpponentId, getWinnerId } from "./pair";
import { GHOST_PLAYER } from "./player";

const isPair = (arg: unknown): arg is Pair => {
  const record = arg as Record<keyof Pair, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.left === "string" &&
    typeof record.right === "string" &&
    typeof record.winner === "string"
  );
};

const isPairs = (arg: unknown): arg is Pair[] => {
  return Array.isArray(arg) && arg.every(isPair);
};

const isMatch = (arg: unknown): arg is Match => {
  const record = arg as Record<keyof Match, unknown>;
  return typeof record.id === "string" && isPairs(record.pairList);
};

export const isMatches = (arg: unknown): arg is Match[] => {
  return Array.isArray(arg) && arg.every(isMatch);
};

export const getPlayerWinCountWithGhost = (
  playerId: PlayerId,
  matches: Match[]
) => {
  if (playerId === GHOST_PLAYER.id) {
    return 0;
  }
  let count = 0;
  for (const match of matches) {
    for (const pair of match.pairList) {
      if (getWinnerId(pair) === playerId) {
        count += 1;
        break;
      }
    }
  }
  return count;
};

// 特定の試合より前の勝ち数を取得する。
export const getPlayerWinCountUntilMatchId = (
  playerId: PlayerId,
  matchId: MatchId,
  matches: Match[]
) => {
  let count = 0;
  for (const match of matches) {
    if (match.id === matchId) {
      break;
    }

    for (const pair of match.pairList) {
      if (getWinnerId(pair) === playerId) {
        count += 1;
        break;
      }
    }
  }
  return count;
};

// 対戦相手の勝ち数を取得する.
export const getOpponentWinCount = (id: PlayerId, matches: Match[]) => {
  let count = 0;
  for (const match of matches) {
    for (const pair of match.pairList) {
      const opponentId = getOpponentId(pair, id);
      if (opponentId) {
        count += getPlayerWinCountWithGhost(opponentId, matches);
        break;
      }
    }
  }
  return count;
};

// 勝った試合の対戦相手の勝ち数を取得する.
export const getDefeatedOpponentWinCount = (
  playerId: PlayerId,
  matches: Match[]
) => {
  let count = 0;
  for (const match of matches) {
    for (const pair of match.pairList) {
      if (getWinnerId(pair) === playerId) {
        const opponentId = getOpponentId(pair, playerId);
        if (opponentId) {
          count += getPlayerWinCountWithGhost(opponentId, matches);
          break;
        } else {
          console.assert(false);
        }
      }
    }
  }
  return count;
};

export const swissDraw = (matches: Match[]) => {
  const getPlayerWinCountForSwissDraw = (id: PlayerId) => {
    if (id === GHOST_PLAYER.id) {
      // スイス式を算出するときだけ、Ghost Playerの勝数を0~試合数のランダムな値に変えたほうが良いかもしれない.
      return 0;
    } else {
      return getPlayerWinCountWithGhost(id, matches);
    }
  };

  const calcWinCountDiffSum = (match: Match) => {
    let sum = 0;
    for (const pair of match.pairList) {
      const left = getPlayerWinCountForSwissDraw(pair.left);
      const right = getPlayerWinCountForSwissDraw(pair.right);
      const diff = Math.abs(left - right);
      sum += diff;
    }
    return sum;
  };

  const diffSumArray = matches.map(calcWinCountDiffSum);

  const minIndex = diffSumArray.indexOf(
    diffSumArray.reduce((a, b) => Math.min(a, b))
  );
  return minIndex;
};

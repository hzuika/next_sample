"use client";
import { Button, Container, List, ListItem, ListSubheader, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

import IconButton from '@mui/material/IconButton';
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import localforage from "localforage";
import { isPlayers } from "@/lib/isPlayers";
import { roundRobin } from "@/lib/roundRobin";

const makeID = () => {
  return crypto.randomUUID();
}

const GHOST_PLAYER: Player = { name: "不在", id: makeID() };

export default function Home() {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [restMatches, setRestMatches] = useState<Match[]>([]);

  const isEven = <T,>(array: T[]) => {
    return (array.length % 2) === 0;
  };

  const clearMatches = () => {
    setMatches([]);
    setRestMatches([]);
  }

  const getPlayerById = (id: string) => {
    if (id === GHOST_PLAYER.id) {
      return GHOST_PLAYER;
    } else {
      return players.find((player) => player.id === id);
    }
  }

  const getPlayerName = (id: string) => {
    const player = getPlayerById(id);
    if (player) {
      return player.name;
    } else {
      return "";
    }
  }

  const getPlayerWinCount = (playerID: string) => {
    if (playerID === GHOST_PLAYER.id) {
      // Ghost Player の勝数は、対戦相手なしの組み合わせを決める上で重要.
      // 常に 0 だと勝っていない人が、対戦相手なしになりやすい.
      // 0 ~ 試合数の間でランダムにすればランダムに決まるはず.
      return 0;
    }

    let count = 0;
    for (const match of matches) {
      for (const pair of match.pairList) {
        if (pair.winnerID === playerID) {
          count += 1;
          break;
        }
      }
    }
    return count;
  }

  // 対戦相手の勝ち数を取得する.
  const getOpponentWinCount = (playerID: string) => {
    let count = 0;
    for (const match of matches) {
      for (const pair of match.pairList) {
        if (pair.leftPlayerID === playerID) {
          const opponentID = pair.rightPlayerID;
          count += getPlayerWinCount(opponentID);
          break;
        } else if (pair.rightPlayerID === playerID) {
          const opponentID = pair.leftPlayerID;
          count += getPlayerWinCount(opponentID);
          break;
        }
      }
    }
    return count;
  }

  // 勝った試合の対戦相手の勝ち数を取得する.
  const getDefeatedOpponentWinCount = (playerID: string) => {
    let count = 0;
    for (const match of matches) {
      for (const pair of match.pairList) {
        if (pair.winnerID === playerID) {
          if (pair.leftPlayerID === playerID) {
            const opponentID = pair.rightPlayerID;
            count += getPlayerWinCount(opponentID);
            break;
          } else if (pair.rightPlayerID === playerID) {
            const opponentID = pair.leftPlayerID;
            count += getPlayerWinCount(opponentID);
            break;
          } else {
            console.assert(false, "Pairの不正な値");
          }
        }
      }
    }
    return count;
  }

  // 特定の試合より前の勝ち数を取得する。
  const getPlayerWinCountUntilMatchID = (playerID: string, matchID: string) => {
    let count = 0;
    for (const match of matches) {
      if (match.id === matchID) {
        break;
      }

      for (const pair of match.pairList) {
        if (pair.winnerID === playerID) {
          count += 1;
          break;
        }
      }
    }
    return count;
  }

  const handleChangeNewPlayerName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPlayerName(e.target.value);
  };

  const handleAddPlayer = () => {
    if (!newPlayerName) {
      return;
    }

    const newPlayer: Player = {
      name: newPlayerName,
      id: makeID(),
    };

    setPlayers((players) => [...players, newPlayer]);
    setNewPlayerName("");
    clearMatches();
  };

  const handleChangePlayerName = (id: string, name: string) => {
    setPlayers((players) => {
      const newPlayers = players.map((player) => {
        if (player.id === id) {
          return { ...player, name: name };
        } else {
          return player;
        }
      });
      return newPlayers;
    });
  };

  const handleDeletePlayer = (index: number) => {
    // TODO: 削除前の確認メッセージを表示する or 削除対象のプレイヤーの試合だけ削除する．
    // 削除対象のプレイヤーの試合だけ削除すると，勝ち数と合わなくなってややこしくなりそうなので，全削除が無難だと思う．
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
    clearMatches();
  };

  const shuffle = <T,>(array: T[]) => {
    return array.toSorted(() => Math.random() - 0.5);
  }

  const makeAllMatches = () => {
    // 参加者が奇数の場合は、存在しない参加者(Ghost Player)を追加して偶数にする。
    // Ghost Player を配列の先頭に追加すると、Round Robin で先頭要素が固定される。
    const shuffledPlayers = shuffle(players);
    const evenPlayers = (isEven(shuffledPlayers)) ? shuffledPlayers : [GHOST_PLAYER, ...shuffledPlayers];

    return roundRobin(evenPlayers.length).map((indexMatch) => {
      const pairList = indexMatch.map((indexPair) => {
        const pair: Pair = {
          leftPlayerID: evenPlayers[indexPair[0]].id,
          rightPlayerID: evenPlayers[indexPair[1]].id,
          winnerID: "",
          id: makeID()
        };
        return pair;
      });
      const match: Match = { pairList: pairList, id: makeID() };
      return match;
    })
  }

  const swissDraw = (matches: Match[]) => {
    const calcWinCountDiffSum = (match: Match) => {
      let sum = 0;
      for (const pair of match.pairList) {
        const left = getPlayerWinCount(pair.leftPlayerID);
        const right = getPlayerWinCount(pair.rightPlayerID);
        const diff = Math.abs(left - right);
        sum += diff;
      }
      return sum;
    };

    const diffSumArray = matches.map(calcWinCountDiffSum);

    const minIndex = diffSumArray.indexOf(diffSumArray.reduce((a, b) => Math.min(a, b)));
    return minIndex;
  }

  const handleMakeMatch = () => {
    const isNew = matches.length <= 0 && restMatches.length <= 0;
    const newRestMatches = isNew ? makeAllMatches() : [...restMatches];

    if (newRestMatches.length <= 0) {
      // 全ての試合を行った.
      return;
    }

    let matchIndex = 0;
    if (isNew) {
      matchIndex = 0;
    } else {
      // ペアの勝ち数の差の合計が最小となるMatchを探す.
      matchIndex = swissDraw(newRestMatches);
    }

    let newMatch = newRestMatches.splice(matchIndex, 1)[0];

    // 対戦相手がいない場合は不戦勝とする.
    if (!isEven(players)) {
      newMatch = {
        ...newMatch,
        pairList: newMatch.pairList.map((pair) => {
          if (pair.leftPlayerID === GHOST_PLAYER.id) {
            pair.winnerID = pair.rightPlayerID;
          } else if (pair.rightPlayerID === GHOST_PLAYER.id) {
            pair.winnerID = pair.leftPlayerID;
          }
          return pair;
        })
      };
    }

    setMatches((matches) => [...matches, newMatch]);
    setRestMatches(newRestMatches);
  };

  const handleWin = (
    newWinnerID: string,
    matchID: string,
    pairID: string,
  ) => {
    setMatches((prevMatches) => {
      return prevMatches.map((match) => {
        if (match.id === matchID) {
          return {
            ...match, pairList: match.pairList.map((pair) => {
              if (pair.id === pairID) {
                return { ...pair, winnerID: newWinnerID };
              } else {
                return pair;
              }
            })
          };
        } else {
          return match;
        }
      })
    })
  }

  const rankedPlayers = players.toSorted((a, b) => {
    const winDiff = getPlayerWinCount(b.id) - getPlayerWinCount(a.id);
    if (winDiff !== 0) {
      return winDiff;
    }

    const opponentWinDiff = getOpponentWinCount(b.id) - getOpponentWinCount(a.id);
    if (opponentWinDiff !== 0) {
      return opponentWinDiff;
    }

    const defeatedOpponentWinDiff = getDefeatedOpponentWinCount(b.id) - getDefeatedOpponentWinCount(a.id);
    return defeatedOpponentWinDiff;
  })

  // ローカルストレージへの保存.
  const STORAGE_KEY = "swiss-draw-players";

  useEffect(() => {
    localforage.getItem(STORAGE_KEY).then((players) => isPlayers(players) && setPlayers(players));
  }, []);

  useEffect(() => {
    localforage.setItem(STORAGE_KEY, players);
  }, [players]);

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 5 }}>

        <TextField
          id="input-name"
          label="参加者名を入力"
          variant="outlined"
          type="text"
          value={newPlayerName}
          onChange={handleChangeNewPlayerName}
        />
        <Button
          variant="contained"
          onClick={handleAddPlayer}
        >
          追加
        </Button>

        <List subheader={
          <ListSubheader component="div" id="list-subheader">
            参加者
          </ListSubheader>
        }>
          {players.map((player, index) => {
            return (
              <ListItem key={player.id}>
                <TextField
                  value={player.name}
                  variant="standard"
                  onChange={(e) => handleChangePlayerName(player.id, e.target.value)}
                />
                <IconButton
                  aria-label="delete"
                  onClick={() => handleDeletePlayer(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            )
          })
          }
        </List>

        <hr />

        <List subheader={
          <ListSubheader component="div" id="list-rank">
            順位
          </ListSubheader>
        }>
          {rankedPlayers.map((player, index) => {
            return (
              <ListItem key={player.id}>
                <Typography>
                  {`${index + 1}. ${player.name}, 勝数: ${getPlayerWinCount(player.id)}, 全点: ${getOpponentWinCount(player.id)}, 勝点: ${getDefeatedOpponentWinCount(player.id)}`}
                </Typography>
              </ListItem>
            )
          })}
        </List>

        <hr />

        <Button
          variant="contained"
          onClick={handleMakeMatch}
        >
          組み合わせを決める
        </Button>

        {matches.map((match, matchIndex) => {
          return (
            <List
              key={match.id}
              subheader={
                <ListSubheader component="div" id="match-list-subheader">
                  {`${matchIndex + 1}試合目`}
                </ListSubheader>
              }
            >
              {match.pairList.map((pair) => {
                return (
                  <ListItem key={pair.id}>
                    <ToggleButtonGroup color="primary" value={pair.winnerID} exclusive onChange={(_, newWinnerID) => handleWin(newWinnerID, match.id, pair.id)}>
                      <ToggleButton value={pair.leftPlayerID}>
                        {`${getPlayerName(pair.leftPlayerID)} (${getPlayerWinCountUntilMatchID(pair.leftPlayerID, match.id)})`}
                      </ToggleButton>
                      <Typography>
                        VS
                      </Typography>
                      <ToggleButton value={pair.rightPlayerID}>
                        {`${getPlayerName(pair.rightPlayerID)} (${getPlayerWinCountUntilMatchID(pair.rightPlayerID, match.id)})`}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </ListItem>
                )
              })}
            </List>
          )
        })}
      </Paper>
    </Container >
  );
}

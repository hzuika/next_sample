"use client";
import { Box, Button, Container, Grid2, List, ListItem, ListItemText, ListSubheader, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

import IconButton from '@mui/material/IconButton';
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import localforage from "localforage";
import { isPlayers } from "@/lib/isPlayers";
import { roundRobin } from "@/lib/roundRobin";
import { isEven, shuffle } from "@/lib/util";

const makeID = () => {
  return crypto.randomUUID();
}

const GHOST_PLAYER: Player = { name: "不在", id: makeID() };

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [restMatches, setRestMatches] = useState<Match[]>([]);
  const [requestAutoFocus, setRequestAutoFocus] = useState(false);

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

  const handleAddPlayer = () => {
    const newPlayer: Player = {
      name: "",
      id: makeID(),
    };

    setPlayers((players) => [...players, newPlayer]);
    clearMatches();
    setRequestAutoFocus(true);
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
    const getPlayerWinCountForSwissDraw = (id: string) => {
      if (id === GHOST_PLAYER.id) {
        // スイス式を算出するときだけ、Ghost Playerの勝数を0~試合数のランダムな値に変えたほうが良いかもしれない.
        return 0;
      } else {
        return getPlayerWinCount(id);
      }
    };

    const calcWinCountDiffSum = (match: Match) => {
      let sum = 0;
      for (const pair of match.pairList) {
        const left = getPlayerWinCountForSwissDraw(pair.leftPlayerID);
        const right = getPlayerWinCountForSwissDraw(pair.rightPlayerID);
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
        <Typography>
          参加者
        </Typography>
        <List>
          {players.map((player, index) => {
            return (
              <ListItem key={player.id}>
                <Typography sx={{ mx: 2 }}>
                  {index + 1}.
                </Typography>
                <TextField
                  value={player.name}
                  variant="standard"
                  onChange={(e) => handleChangePlayerName(player.id, e.target.value)}
                  autoFocus={(index === (players.length - 1)) && requestAutoFocus}
                  placeholder="参加者名を入力"
                  error={player.name.length <= 0}
                  fullWidth
                />
                <IconButton
                  aria-label="delete player"
                  onClick={() => handleDeletePlayer(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            )
          })
          }
          <Button
            variant="outlined"
            onClick={handleAddPlayer}
            fullWidth
          >
            ＋参加者を追加
          </Button>
        </List>

        <hr />

        <Typography>
          順位表
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>順位</TableCell>
                <TableCell>名前</TableCell>
                <TableCell>勝数</TableCell>
                <TableCell>全点</TableCell>
                <TableCell>勝点</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rankedPlayers.map((player, index) => {
                return (
                  <TableRow key={player.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{getPlayerWinCount(player.id)}</TableCell>
                    <TableCell>{getOpponentWinCount(player.id)}</TableCell>
                    <TableCell>{getDefeatedOpponentWinCount(player.id)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <hr />

        <Typography>
          対戦表
        </Typography>

        <Button
          variant="contained"
          onClick={handleMakeMatch}
          fullWidth
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
                const PlayerButton = ({ playerID }: { playerID: string }) => {
                  return (
                    <ToggleButton color="primary" fullWidth value={playerID} selected={pair.winnerID === playerID} onChange={(_, newWinnerID) => handleWin(newWinnerID, match.id, pair.id)}>
                      {`${getPlayerName(playerID)} (${getPlayerWinCountUntilMatchID(playerID, match.id)})`}
                    </ToggleButton>
                  )
                };

                return (
                  <ListItem key={pair.id}>
                    <Box sx={{ width: "100%" }}>
                      <Grid2 container spacing={2} alignItems="baseline">
                        <Grid2 size="grow">
                          <PlayerButton playerID={pair.leftPlayerID} />
                        </Grid2>

                        <Grid2 size="auto">
                          <Typography>
                            VS
                          </Typography>
                        </Grid2>

                        <Grid2 size="grow">
                          <PlayerButton playerID={pair.rightPlayerID} />
                        </Grid2>
                      </Grid2>
                    </Box>
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

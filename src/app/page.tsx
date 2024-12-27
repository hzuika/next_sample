"use client";
import { Box, Button, Container, Grid2, List, ListItem, ListSubheader, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ThemeProvider, ToggleButton, Typography, createTheme } from "@mui/material";

import IconButton from '@mui/material/IconButton';
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import localforage from "localforage";
import { isPlayers } from "@/lib/isPlayers";
import { roundRobin } from "@/lib/roundRobin";
import { isEven, shuffle, makeId } from "@/lib/util";
import { getOpponentId, getSide, getWinnerId } from "@/lib/pair";
import { indigo } from "@mui/material/colors";

const GHOST_PLAYER: Player = { name: "不在", id: makeId() as PlayerId };

const theme = createTheme({
  typography: {
    button: {
      textTransform: "none"
    }
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: "outlined"
      }
    }
  },
  palette: {
    primary: indigo,
  }
});

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [restMatches, setRestMatches] = useState<Match[]>([]);
  const [requestAutoFocus, setRequestAutoFocus] = useState(false);

  const clearMatches = () => {
    setMatches([]);
    setRestMatches([]);
  }

  const getPlayerById = (id: PlayerId) => {
    if (id === GHOST_PLAYER.id) {
      return GHOST_PLAYER;
    } else {
      return players.find((player) => player.id === id);
    }
  }

  const getPlayerName = (id: PlayerId) => {
    const player = getPlayerById(id);
    if (player) {
      return player.name;
    } else {
      return "";
    }
  }

  const getPlayerWinCount = (playerId: PlayerId) => {
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
  }

  // 対戦相手の勝ち数を取得する.
  const getOpponentWinCount = (id: PlayerId) => {
    let count = 0;
    for (const match of matches) {
      for (const pair of match.pairList) {
        const opponentId = getOpponentId(pair, id);
        if (opponentId) {
          count += getPlayerWinCount(opponentId);
          break;
        }
      }
    }
    return count;
  }

  // 勝った試合の対戦相手の勝ち数を取得する.
  const getDefeatedOpponentWinCount = (playerId: PlayerId) => {
    let count = 0;
    for (const match of matches) {
      for (const pair of match.pairList) {
        if (getWinnerId(pair) === playerId) {
          const opponentId = getOpponentId(pair, playerId);
          if (opponentId) {
            count += getPlayerWinCount(opponentId);
            break;
          } else {
            console.assert(false);
          }
        }
      }
    }
    return count;
  }

  // 特定の試合より前の勝ち数を取得する。
  const getPlayerWinCountUntilMatchId = (playerId: PlayerId, matchId: MatchId) => {
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
  }

  const handleAddPlayer = () => {
    const newPlayer: Player = {
      name: "",
      id: makeId() as PlayerId,
    };

    setPlayers((players) => [...players, newPlayer]);
    clearMatches();
    setRequestAutoFocus(true);
  };

  const handleChangePlayerName = (id: PlayerId, name: string) => {
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
          left: evenPlayers[indexPair[0]].id,
          right: evenPlayers[indexPair[1]].id,
          winner: "none",
          id: makeId() as PairId
        };
        return pair;
      });
      const match: Match = { pairList: pairList, id: makeId() as MatchId };
      return match;
    })
  }

  const swissDraw = (matches: Match[]) => {
    const getPlayerWinCountForSwissDraw = (id: PlayerId) => {
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
        const left = getPlayerWinCountForSwissDraw(pair.left);
        const right = getPlayerWinCountForSwissDraw(pair.right);
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
          if (pair.left === GHOST_PLAYER.id) {
            pair.winner = "right";
          } else if (pair.right === GHOST_PLAYER.id) {
            pair.winner = "left";
          }
          return pair;
        })
      };
    }

    setMatches((matches) => [...matches, newMatch]);
    setRestMatches(newRestMatches);
  };

  const handleWin = (
    newWinnerId: PlayerId,
    matchId: MatchId,
    pairId: PairId,
  ) => {
    setMatches((prevMatches): Match[] => {
      return prevMatches.map((match) => {
        if (match.id === matchId) {
          return {
            ...match, pairList: match.pairList.map((pair) => {
              if (pair.id === pairId) {
                return { ...pair, winner: getSide(pair, newWinnerId) };
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
    <ThemeProvider theme={theme}>
      <Container>
        <Paper elevation={3} sx={{ p: 5 }}>
          <Typography>
            参加者
          </Typography>
          <List>
            {players.map((player, index) => {
              return (
                <ListItem key={player.id}>
                  <Stack spacing={1} direction="row" sx={{ width: "100%" }} alignItems="center">
                    <Typography>
                      {index + 1}
                    </Typography>
                    <TextField
                      value={player.name}
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
                  </Stack>
                </ListItem>
              )
            })
            }
            <ListItem>
              <Button
                variant="outlined"
                onClick={handleAddPlayer}
                fullWidth
              >
                ＋参加者を追加
              </Button>
            </ListItem>
          </List>

          <hr />

          <Typography>
            順位表
          </Typography>
          <TableContainer>
            <Table>
              <caption>全点 = 対戦相手の勝数の合計。勝点 = 勝った対戦相手の勝数の合計。</caption>
              <TableHead>
                <TableRow>
                  <TableCell>順位</TableCell>
                  <TableCell>名前</TableCell>
                  <TableCell align="right">勝数</TableCell>
                  <TableCell align="right">全点</TableCell>
                  <TableCell align="right">勝点</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankedPlayers.map((player, index) => {
                  return (
                    <TableRow key={player.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{player.name}</TableCell>
                      <TableCell align="right">{getPlayerWinCount(player.id)}</TableCell>
                      <TableCell align="right">{getOpponentWinCount(player.id)}</TableCell>
                      <TableCell align="right">{getDefeatedOpponentWinCount(player.id)}</TableCell>
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
                  const PlayerButton = ({ playerId: playerId }: { playerId: PlayerId }) => {
                    return (
                      <ToggleButton color="primary" fullWidth value={playerId} selected={getWinnerId(pair) === playerId} onChange={(_, newWinnerId) => handleWin(newWinnerId, match.id, pair.id)}>
                        {`${getPlayerName(playerId)} (${getPlayerWinCountUntilMatchId(playerId, match.id)})`}
                      </ToggleButton>
                    )
                  };

                  return (
                    <ListItem key={pair.id}>
                      <Box sx={{ width: "100%" }}>
                        <Grid2 container spacing={2} alignItems="baseline">
                          <Grid2 size="grow">
                            <PlayerButton playerId={pair.left} />
                          </Grid2>

                          <Grid2 size="auto">
                            <Typography>
                              VS
                            </Typography>
                          </Grid2>

                          <Grid2 size="grow">
                            <PlayerButton playerId={pair.right} />
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
    </ThemeProvider>
  );
}

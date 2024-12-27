"use client";
import { Box, Button, Container, Grid2, List, ListItem, ListSubheader, Paper, Stack, Tab, Tabs, TextField, ThemeProvider, ToggleButton, Typography, createTheme } from "@mui/material";

import IconButton from '@mui/material/IconButton';
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useRef, useState } from "react";
import localforage from "localforage";
import { isPlayers } from "@/lib/isPlayers";
import { roundRobin } from "@/lib/roundRobin";
import { isEven, shuffle, makeId, isEmpty } from "@/lib/util";
import { getSide, getWinnerId } from "@/lib/pair";
import { indigo } from "@mui/material/colors";
import { GHOST_PLAYER, getHelperTextForNameValidation, getPlayerName, isValidPlayerName } from "@/lib/player";
import { getPlayerWinCountUntilMatchId, swissDraw } from "@/lib/match";
import { RankTable } from "@/components/rankTable";

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

const tabList = ["対戦表", "順位表"];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      hidden={value !== index}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [restMatches, setRestMatches] = useState<Match[]>([]);

  const [tab, setTab] = useState(0);

  const [requestAutoFocus, setRequestAutoFocus] = useState(false);

  const [requestScrollEnd, setRequestScrollEnd] = useState(true);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [requestScrollEnd]);

  const clearMatches = () => {
    setMatches([]);
    setRestMatches([]);
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

  const handleMakeMatch = () => {
    const isNew = isEmpty(matches) && isEmpty(restMatches);
    const newRestMatches = isNew ? makeAllMatches() : [...restMatches];

    if (isEmpty(newRestMatches)) {
      // 全ての試合を行った.
      alert("全ての試合が完了しました。");
      return;
    }

    for (const match of matches) {
      for (const pair of match.pairList) {
        if (pair.winner === "none") {
          // TODO ダイアログにする。
          alert("前の試合が完了していません。");
          return;
        }
      }
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
    setRequestScrollEnd((prev) => !prev)
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
                if (getWinnerId(pair) === newWinnerId) {
                  return { ...pair, winner: "none" };
                } else {
                  return { ...pair, winner: getSide(pair, newWinnerId) };
                }
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

  const handleChangeTab = (_: React.SyntheticEvent, newTab: number) => {
    setTab(newTab);
  };

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
                      helperText={getHelperTextForNameValidation(player.name, players)}
                      error={isValidPlayerName(player.name, players) !== "valid"}
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

          <Box sx={{ width: "100%" }}>
            <Stack spacing={1}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tab} onChange={handleChangeTab} centered>
                  <Tab label={tabList[0]} sx={{ flexGrow: 1 }} />
                  <Tab label={tabList[1]} sx={{ flexGrow: 1 }} />
                </Tabs>
              </Box>

              <TabPanel value={tab} index={0}></TabPanel>
              <TabPanel value={tab} index={1}>
                <RankTable players={players} matches={matches} />
              </TabPanel>
            </Stack>
          </Box>

          <Typography>
            対戦表
          </Typography>

          <List subheader={<ListSubheader>勝者の名前をクリックします。もう一度クリックするとリセットされます。</ListSubheader>}>
            {matches.map((match, matchIndex) => {
              return (
                <ListItem key={match.id}>
                  <Stack sx={{ width: "100%" }}>
                    <Typography>{`${matchIndex + 1}試合目`}</Typography>
                    <List>
                      {match.pairList.map((pair) => {
                        const PlayerButton = ({ playerId: playerId }: { playerId: PlayerId }) => {
                          return (
                            <ToggleButton color="primary" fullWidth value={playerId} selected={getWinnerId(pair) === playerId} onChange={(_, newWinnerId) => handleWin(newWinnerId, match.id, pair.id)}>
                              {`${(pair.winner === "none" ? "" : (getWinnerId(pair) === playerId) ? "◯" : "✗")} ${getPlayerName(playerId, [...players, GHOST_PLAYER])} (${getPlayerWinCountUntilMatchId(playerId, match.id, matches)})`}
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

                  </Stack>
                </ListItem>
              )
            })}
          </List>

          <Stack sx={{ width: "100%" }} spacing={2}>
            <Button
              variant="contained"
              onClick={handleMakeMatch}
            >
              組み合わせを決める
            </Button>

            <Button
              color="error"
              variant="outlined"
              onClick={() => clearMatches()}
            >
              対戦表を削除する
            </Button>
          </Stack>


          <div ref={scrollEndRef} />
        </Paper>
      </Container >
    </ThemeProvider>
  );
}

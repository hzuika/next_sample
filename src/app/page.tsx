"use client";
import { Button, Container, List, ListItem, ListSubheader, Paper, TextField } from "@mui/material";

import IconButton from '@mui/material/IconButton';
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import localforage from "localforage";
import { isPlayers } from "@/lib/isPlayers";

const makeID = () => {
  return crypto.randomUUID();
}

const GHOST_PLAYER: Player = { name: "不在", id: makeID(), winCount: 0 };

export default function Home() {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const isExistedPair = (playerID0: string, playerID1: string) => {
    for (let match of matches) {
      for (let pair of match.pairList) {
        if (pair.leftPlayerID === playerID0) {
          if (pair.rightPlayerID === playerID1) {
            return true;
          }
        }

        if (pair.rightPlayerID === playerID1) {
          if (pair.leftPlayerID === playerID0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  const getPlayerById = (id: string) => {
    return players.find((player) => player.id === id);
  }

  const getPlayerName = (id: string) => {
    if (id === GHOST_PLAYER.id) {
      return GHOST_PLAYER.name;
    }

    const player = getPlayerById(id);
    if (player) {
      return player.name;
    } else {
      return "";
    }
  }

  const onChangeNewPlayerName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPlayerName(e.target.value);
  };

  const onAddPlayer = () => {
    if (!newPlayerName) {
      return;
    }

    const newPlayer: Player = {
      name: newPlayerName,
      id: makeID(),
      winCount: 0,
    };

    setPlayers((players) => [...players, newPlayer]);
    setNewPlayerName("");
    setMatches([]);
  };

  const onChangePlayerName = (id: string, name: string) => {
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

  const onDeletePlayer = (index: number) => {
    // TODO: 削除前の確認メッセージを表示する or 削除対象のプレイヤーの試合だけ削除する．
    // 削除対象のプレイヤーの試合だけ削除すると，勝ち数と合わなくなってややこしくなりそうなので，全削除が無難だと思う．
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
    setMatches([]);
  };

  const onMakeMatch = () => {
    const sortedPlayers = players.toSorted((a, b) => {
      return a.winCount - b.winCount;
    });

    const newMatch: Match = { pairList: [], id: makeID() };

    while (sortedPlayers.length > 0) {
      const left = sortedPlayers.shift();
      if (left) {
        if (sortedPlayers.length > 0) {
          let index = 0;
          for (; index < sortedPlayers.length; ++index) {
            const rightPlayer = sortedPlayers[index];
            if (!isExistedPair(left.id, rightPlayer.id)) {
              const pair: Pair = { leftPlayerID: left.id, rightPlayerID: rightPlayer.id, id: makeID() };
              newMatch.pairList.push(pair);
              break;
            }
          }
          sortedPlayers.splice(index, 1);
        } else {
          // プレイヤー数が奇数の場合の最後．
          const pair: Pair = { leftPlayerID: left.id, rightPlayerID: GHOST_PLAYER.id, id: makeID() };
          newMatch.pairList.push(pair);
          console.assert(!isExistedPair(pair.leftPlayerID, pair.rightPlayerID));
          break;
        }
      }
    }

    if (newMatch.pairList.length > 0) {
      setMatches((matches) => [...matches, newMatch]);
    }
  };

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
          onChange={onChangeNewPlayerName}
        />
        <Button
          variant="contained"
          onClick={onAddPlayer}
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
                  onChange={(e) => onChangePlayerName(player.id, e.target.value)}
                />
                <IconButton
                  aria-label="delete"
                  onClick={() => onDeletePlayer(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            )
          })
          }
        </List>

        <Button
          variant="contained"
          onClick={onMakeMatch}
        >
          組み合わせを決める
        </Button>

        {matches.map((match, matchIndex) => {
          return (
            <List
              key={match.id}
              subheader={
                <ListSubheader component="div" id="match-list-subheader">
                  {`${matchIndex}試合目`}
                </ListSubheader>
              }
            >
              {match.pairList.map((pair) => {
                return (
                  <ListItem key={pair.id}>
                    {`${getPlayerName(pair.leftPlayerID)} vs ${getPlayerName(pair.rightPlayerID)}`}
                  </ListItem>
                )
              })}
            </List>
          )
        })}

      </Paper>
    </Container>
  );
}

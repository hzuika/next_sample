"use client";
import { Button, Container, List, ListItem, ListSubheader, Paper, TextField } from "@mui/material";

import IconButton from '@mui/material/IconButton';
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import localforage from "localforage";
import { isPlayers } from "@/lib/isPlayers";

export default function Home() {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);

  const onChangeNewPlayerName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPlayerName(e.target.value);
  };

  const onAddPlayer = () => {
    if (!newPlayerName) {
      return;
    }

    const newPlayer: Player = {
      name: newPlayerName,
      id: new Date().getTime(),
    };

    setPlayers((players) => [...players, newPlayer]);
    setNewPlayerName("");
  };

  const onChangePlayerName = (id: number, name: string) => {
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
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
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

      </Paper>
    </Container>
  );
}

import { Button, Checkbox, Container, FormControlLabel, FormGroup, Paper } from "@mui/material";

export default function Home() {
  return (
    <Container>
      <Paper elevation={3} sx={{ p: 5 }}>
        <h1>Welcome to Material UI!</h1>
        <FormGroup>
          <FormControlLabel control={<Checkbox defaultChecked />} label="Label" />
          <FormControlLabel required control={<Checkbox defaultChecked />} label="Required" />
          <FormControlLabel disabled control={<Checkbox defaultChecked />} label="Disabled" />
        </FormGroup>
        <hr />
        <Button variant="contained" color="primary">ボタン</Button>
      </Paper>
    </Container>
  );
}

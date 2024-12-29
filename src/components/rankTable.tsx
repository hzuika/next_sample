import { getDefeatedOpponentWinCount, getOpponentWinCount, getPlayerWinCountWithGhost } from "@/lib/match";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

type CellInfo = {
    readonly name: string,
    readonly id: PlayerId,
    readonly winCount: number,
    readonly opponentWinCount: number,
    readonly defeatedOpponentWinCount: number,
};

export const RankTable = ({ players: players, matches: matches }: { players: Player[], matches: Match[] }) => {
    const cellInfos: CellInfo[] = players.map((player) => {
        return { name: player.name, id: player.id, winCount: getPlayerWinCountWithGhost(player.id, matches), opponentWinCount: getOpponentWinCount(player.id, matches), defeatedOpponentWinCount: getDefeatedOpponentWinCount(player.id, matches) }
    })

    const rankedCellInfos = cellInfos.toSorted((a, b) => {
        const winDiff = b.winCount - a.winCount;
        if (winDiff !== 0) {
            return winDiff;
        }

        const opponentWinDiff = b.opponentWinCount - a.opponentWinCount;
        if (opponentWinDiff !== 0) {
            return opponentWinDiff;
        }

        const defeatedOpponentWinDiff = b.defeatedOpponentWinCount - a.defeatedOpponentWinCount;
        return defeatedOpponentWinDiff;
    })

    return (
        <Box>
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
                        {rankedCellInfos.map((cellInfo, index) => {
                            return (
                                <TableRow key={cellInfo.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{cellInfo.name}</TableCell>
                                    <TableCell align="right">{cellInfo.winCount}</TableCell>
                                    <TableCell align="right">{cellInfo.opponentWinCount}</TableCell>
                                    <TableCell align="right">{cellInfo.defeatedOpponentWinCount}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

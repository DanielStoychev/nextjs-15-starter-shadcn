import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/registry/new-york-v4/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/registry/new-york-v4/ui/table";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboards',
  description: 'View the top players and their rankings across various mini-competitions on FootyGames.co.uk.',
};

const leaderboardData = [
  { rank: 1, name: "PlayerOne", score: 1500, game: "Last Man Standing" },
  { rank: 2, name: "FootballFanatic", score: 1450, game: "Table Predictor" },
  { rank: 3, name: "GoalGetter", score: 1400, game: "Weekly Score Predictor" },
  { rank: 4, name: "Tactician", score: 1380, game: "Race to 33" },
  { rank: 5, name: "ProPredictor", score: 1350, game: "Last Man Standing" },
];

export default function LeaderboardsPage() {
  return (
    <main className="flex min-h-[calc(100vh-14rem)] flex-col items-center p-4 sm:p-8">
      <Card className="w-full max-w-4xl bg-card text-card-foreground border-border shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl sm:text-4xl font-bold mb-4">
            Leaderboards
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            See who's at the top of the game!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of top players across various competitions.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rank</TableHead>
                <TableHead>Player Name</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Game</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((entry) => (
                <TableRow key={entry.rank}>
                  <TableCell className="font-medium">{entry.rank}</TableCell>
                  <TableCell>{entry.name}</TableCell>
                  <TableCell>{entry.score}</TableCell>
                  <TableCell className="text-right">{entry.game}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

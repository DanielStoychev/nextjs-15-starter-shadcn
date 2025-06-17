import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Button } from "@/registry/new-york-v4/ui/button";
import Link from "next/link";
import type { Metadata } from 'next';

// Function to generate dynamic metadata
export async function generateMetadata({ params }: { params: { gameSlug: string } }): Promise<Metadata> {
  const gameSlug = params.gameSlug;
  const formattedGameSlug = gameSlug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    title: `${formattedGameSlug} - Game Details`,
    description: `Detailed information about the ${formattedGameSlug} mini-competition on FootyGames.co.uk. Learn rules, entry fees, and prize funds.`,
  };
}

export default function GamePage({ params }: { params: { gameSlug: string } }) {
  const gameSlug = params.gameSlug;

  // Placeholder data for a generic game
  const gameData = {
    title: `Game: ${gameSlug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}`,
    description: `This is a placeholder page for the ${gameSlug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())} mini-competition. Detailed rules and gameplay will be implemented here.`,
    rules: [
      "Rule 1: This is a generic rule.",
      "Rule 2: More specific rules will be added later.",
      "Rule 3: Enjoy the game!",
    ],
    entryFee: "£5.00", // Static for now
    prizeFund: "£100.00 (Placeholder)", // Static for now
  };

  return (
    <main className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-4xl text-center bg-card text-card-foreground border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl sm:text-4xl font-bold mb-4">
            {gameData.title}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {gameData.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="text-left">
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Rules:</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              {gameData.rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
            <div className="text-xl font-bold text-foreground">
              Entry Fee: {gameData.entryFee}
            </div>
            <div className="w-full sm:w-1/2 bg-muted rounded-full h-8 flex items-center justify-center relative overflow-hidden border border-border">
              <div className="absolute inset-0 bg-accent-orange/20" style={{ width: '75%' }}></div> {/* Placeholder for progress */}
              <div className="relative z-10 text-xl font-bold text-accent-orange">
                Prize Fund: {gameData.prizeFund}
              </div>
            </div>
          </div>

          <Button asChild className="bg-accent-orange text-foreground hover:bg-accent-orange/90 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 w-full sm:w-auto">
            <Link href="#">Join Game (Coming Soon)</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

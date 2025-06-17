import type { Metadata } from 'next'; // Import Metadata type
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Competitions',
  description: 'Explore all available mini-competitions on FootyGames.co.uk. Join Last Man Standing, Table Predictor, Weekly Score Predictor, and Race to 33!',
};

const allCompetitions = [
    {
        title: 'Last Man Standing',
        description: 'Pick one winner each week. Survive the longest to claim the prize!',
        link: '#',
    },
    {
        title: 'Table Predictor',
        description: 'Predict the final Premier League table. Accuracy is key!',
        link: '#',
    },
    {
        title: 'Weekly Score Predictor',
        description: 'Guess the scores for weekly matches and earn points.',
        link: '#',
    },
    {
        title: 'Race to 33',
        description: 'Be the first to accumulate 33 points from match predictions.',
        link: '#',
    },
];

export default function CompetitionsPage() {
    return (
        <main className="flex min-h-[calc(100vh-14rem)] flex-col items-center p-8">
            <h1 className="text-4xl font-bold mb-8">All Competitions</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl w-full">
                {allCompetitions.map((competition, index) => (
                    <Link href={competition.link} key={index}>
                        <Card className="bg-gray-800 text-white border-gray-700 shadow-xl h-full flex flex-col hover:border-green-500 transition-colors duration-200">
                            <CardHeader>
                                <CardTitle className="text-green-400">{competition.title}</CardTitle>
                                <CardDescription className="text-gray-400">
                                    {competition.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                {/* Additional content for the card can go here */}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </main>
    );
}

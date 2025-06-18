import type { Metadata } from 'next';
import Link from 'next/link';

// Import Metadata type
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

export const metadata: Metadata = {
    title: 'Competitions',
    description:
        'Explore all available mini-competitions on FootyGames.co.uk. Join Last Man Standing, Table Predictor, Weekly Score Predictor, and Race to 33!'
};

const allCompetitions = [
    {
        title: 'Last Man Standing',
        slug: 'last-man-standing',
        description: 'Pick one winner each week. Survive the longest to claim the prize!'
    },
    {
        title: 'Table Predictor',
        slug: 'table-predictor',
        description: 'Predict the final Premier League table. Accuracy is key!'
    },
    {
        title: 'Weekly Score Predictor',
        slug: 'weekly-score-predictor',
        description: 'Guess the scores for weekly matches and earn points.'
    },
    {
        title: 'Race to 33',
        slug: 'race-to-33',
        description: 'Be the first to accumulate 33 points from match predictions.'
    }
];

export default function CompetitionsPage() {
    return (
        <main className='flex min-h-[calc(100vh-14rem)] flex-col items-center p-8'>
            <h1 className='mb-8 text-4xl font-bold'>All Competitions</h1>
            <div className='grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
                {allCompetitions.map((competition, index) => (
                    <Link href={`/games/${competition.slug}`} key={index}>
                        <Card className='flex h-full flex-col border-gray-700 bg-gray-800 text-white shadow-xl transition-colors duration-200 hover:border-green-500'>
                            <CardHeader>
                                <CardTitle className='text-green-400'>{competition.title}</CardTitle>
                                <CardDescription className='text-gray-400'>{competition.description}</CardDescription>
                            </CardHeader>
                            <CardContent className='flex-grow'>
                                {/* Additional content for the card can go here */}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </main>
    );
}

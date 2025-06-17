import { notFound } from 'next/navigation';

import { GameRulesButton } from '@/components/game-rules-button';
import { LastManStandingGame } from '@/components/last-man-standing-game';
import { LastManStandingLeaderboard } from '@/components/last-man-standing-leaderboard';
import { Game, GameInstance } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

interface GamePageProps {
    params: {
        gameSlug: string;
        instanceId: string;
    };
}

interface SportMonksLeague {
    id: number;
    name: string;
    current_season_id?: number; // Make optional as it might be nested
    currentSeason?: {
        data: {
            id: number;
            name: string;
            finished: boolean; // Add finished property
        };
    };
}

interface SportMonksRound {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
}

interface SportMonksFixture {
    id: number;
    name: string;
    starting_at: string;
    participants: Array<{
        id: number;
        name: string;
        image_path: string;
        meta: {
            location: 'home' | 'away';
        };
    }>;
    scores: Array<{
        score: {
            home: number;
            away: number;
        };
        description: string;
        type: 'FT' | 'HT' | 'ET' | 'PEN';
    }>;
}

export default async function GamePage({ params }: GamePageProps) {
    const { gameSlug, instanceId } = await params;

    const gameInstance = await prisma.gameInstance.findUnique({
        where: { id: instanceId },
        include: {
            game: true // Include the related Game model
        }
    });

    if (!gameInstance || gameInstance.game.slug !== gameSlug) {
        notFound();
    }

    const game = gameInstance.game; // Access the related Game model

    const currentRoundId: string | null = 'cmc0kzbgu0008lojo8utb6pzd'; // Use the actual dummy round ID
    const fixtures: SportMonksFixture[] = [
        {
            id: 1001,
            name: 'Match 1',
            starting_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            participants: [
                {
                    id: 1,
                    name: 'Arsenal',
                    image_path: '/images/teams/arsenal.png', // Local logo
                    meta: { location: 'home' }
                },
                {
                    id: 2,
                    name: 'Chelsea',
                    image_path: '/images/teams/chelsea.png', // Local logo
                    meta: { location: 'away' }
                }
            ],
            scores: []
        },
        {
            id: 1002,
            name: 'Match 2',
            starting_at: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
            participants: [
                {
                    id: 3,
                    name: 'Liverpool',
                    image_path: '/images/teams/liverpool.png', // Local logo
                    meta: { location: 'home' }
                },
                {
                    id: 4,
                    name: 'Man Utd',
                    image_path: '/images/teams/man_utd.png', // Local logo
                    meta: { location: 'away' }
                }
            ],
            scores: []
        }
    ];
    const isSeasonFinished: boolean = false; // Hardcode for testing

    return (
        <div className='container mx-auto py-8'>
            <div className='mb-8 flex items-center justify-between'>
                <h1 className='text-3xl font-bold'>{gameInstance.name}</h1>
                {game.description && <GameRulesButton title={`${game.name} Rules`} description={game.description} />}
            </div>

            <Card className='mb-6'>
                <CardHeader>
                    <CardTitle>Game Details</CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        <strong>Game Type:</strong> {game.name}
                    </p>
                    <p>
                        <strong>Status:</strong> {gameInstance.status}
                    </p>
                    <p>
                        <strong>Starts:</strong> {new Date(gameInstance.startDate).toLocaleDateString()}
                    </p>
                    <p>
                        <strong>Ends:</strong> {new Date(gameInstance.endDate).toLocaleDateString()}
                    </p>
                    <p>
                        <strong>Entry Fee:</strong> £{(gameInstance.entryFee / 100).toFixed(2)}
                    </p>
                    <p>
                        <strong>Prize Pool:</strong> £{(gameInstance.prizePool / 100).toFixed(2)}
                    </p>
                </CardContent>
            </Card>

            {/* Conditionally render game-specific UI */}
            {game.slug === 'last-man-standing' && (
                <LastManStandingGame
                    gameInstance={gameInstance}
                    fixtures={fixtures}
                    currentRoundId={currentRoundId}
                    isSeasonFinished={isSeasonFinished}
                />
            )}

            {game.slug === 'last-man-standing' && (
                <div className='mt-8'>
                    <LastManStandingLeaderboard gameInstanceId={gameInstance.id} />
                </div>
            )}
            {/* Add other game components here as they are implemented */}
        </div>
    );
}

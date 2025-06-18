import { notFound } from 'next/navigation';

import { GameRulesButton } from '@/components/game-rules-button';
import { LastManStandingGame } from '@/components/last-man-standing-game';
import { LastManStandingLeaderboard } from '@/components/last-man-standing-leaderboard';
import { RaceTo33Game } from '@/components/race-to-33-game';
import { RaceTo33Leaderboard } from '@/components/race-to-33-leaderboard';
import TablePredictorGame from '@/components/table-predictor-game';
import TablePredictorLeaderboard from '@/components/table-predictor-leaderboard';
import WeeklyScorePredictorGame from '@/components/weekly-score-predictor-game';
import WeeklyScorePredictorLeaderboard from '@/components/weekly-score-predictor-leaderboard';
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

    // Fetch the dummy round ID from the database for Last Man Standing
    let lmsCurrentRoundId: string | null = null;
    if (game.slug === 'last-man-standing') {
        const dummyRoundFromDb = await prisma.round.findUnique({
            where: { sportMonksId: 123456789 }, // As defined in seed.js
            select: { id: true }
        });
        if (dummyRoundFromDb) {
            lmsCurrentRoundId = dummyRoundFromDb.id;
        } else {
            console.error('Dummy round (sportMonksId: 123456789) not found in DB for LMS game page.');
            // Fallback or error handling - for now, it might proceed with null, causing issues in LMS
        }
    }
    // For other games, currentRoundId might be determined differently or not applicable in this simplified context
    const currentRoundIdToPass = game.slug === 'last-man-standing' ? lmsCurrentRoundId : 'cmc0kzbgu0008lojo8utb6pzd'; // Default for other games if needed, or make specific

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

    const dummyTeams = [
        { id: 'team-arsenal', name: 'Arsenal', logoPath: '/images/teams/arsenal.png' },
        { id: 'team-chelsea', name: 'Chelsea', logoPath: '/images/teams/chelsea.png' },
        { id: 'team-liverpool', name: 'Liverpool', logoPath: '/images/teams/liverpool.png' },
        { id: 'team-man-utd', name: 'Man Utd', logoPath: '/images/teams/man_utd.png' },
        { id: 'team-man-city', name: 'Man City', logoPath: '/images/teams/machester_city.png' },
        { id: 'team-tottenham', name: 'Tottenham', logoPath: '/images/teams/tottenham.png' },
        { id: 'team-newcastle', name: 'Newcastle', logoPath: '/images/teams/newcastle.png' },
        { id: 'team-brighton', name: 'Brighton', logoPath: '/images/teams/brighton.png' },
        { id: 'team-west-ham', name: 'West Ham', logoPath: '/images/teams/west_ham.png' },
        { id: 'team-aston-villa', name: 'Aston Villa', logoPath: '/images/teams/aston_villa.png' },
        { id: 'team-crystal-palace', name: 'Crystal Palace', logoPath: '/images/teams/crystal-palace.png' },
        { id: 'team-fulham', name: 'Fulham', logoPath: '/images/teams/fulham.png' },
        { id: 'team-wolves', name: 'Wolverhampton', logoPath: '/images/teams/wolverhampton.png' },
        { id: 'team-bournemouth', name: 'Bournemouth', logoPath: '/images/teams/bournemouth.png' },
        { id: 'team-brentford', name: 'Brentford', logoPath: '/images/teams/brentford.png' },
        { id: 'team-everton', name: 'Everton', logoPath: '/images/teams/everton.png' },
        { id: 'team-nottingham-forest', name: 'Nottingham Forest', logoPath: '/images/teams/nottingham_forest.png' },
        { id: 'team-burnley', name: 'Burnley', logoPath: '/images/teams/burnley.png' },
        { id: 'team-leeds', name: 'Leeds', logoPath: '/images/teams/leeds.png' },
        { id: 'team-sunderland', name: 'Sunderland', logoPath: '/images/teams/sunderland.png' }
    ];

    const dummyWeeklyFixtures = [
        {
            id: 'fixture-1',
            homeTeam: { id: 'team-arsenal', name: 'Arsenal', logoPath: '/images/teams/arsenal.png' },
            awayTeam: { id: 'team-chelsea', name: 'Chelsea', logoPath: '/images/teams/chelsea.png' },
            matchDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        },
        {
            id: 'fixture-2',
            homeTeam: { id: 'team-liverpool', name: 'Liverpool', logoPath: '/images/teams/liverpool.png' },
            awayTeam: { id: 'team-man-utd', name: 'Man Utd', logoPath: '/images/teams/man_utd.png' },
            matchDate: new Date(Date.now() + 172800000).toISOString() // Day after tomorrow
        },
        {
            id: 'fixture-3',
            homeTeam: { id: 'team-tottenham', name: 'Tottenham', logoPath: '/images/teams/tottenham.png' },
            awayTeam: { id: 'team-newcastle', name: 'Newcastle', logoPath: '/images/teams/newcastle.png' },
            matchDate: new Date(Date.now() + 259200000).toISOString() // 3 days from now
        }
    ];

    return (
        <div className='container mx-auto py-8'>
            <div className='mb-8 flex items-center justify-between'>
                <div className='flex-grow text-center'>
                    <h1 className='text-3xl font-bold'>{gameInstance.name}</h1>
                </div>
                {game.description && <GameRulesButton title={`${game.name} Rules`} description={game.description} />}
            </div>

            <Card className='mb-6'>
                <CardHeader className='text-center'>
                    <CardTitle className='text-center'>Game Details</CardTitle>
                    <CardDescription className='text-center'>{game.description}</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col items-center gap-2'>
                    <p>
                        <strong className='font-medium'>Game Type:</strong> {game.name}
                    </p>
                    <p>
                        <strong className='font-medium'>Status:</strong> {gameInstance.status}
                    </p>
                    <p>
                        <strong className='font-medium'>Starts:</strong>{' '}
                        {new Date(gameInstance.startDate).toLocaleDateString()}
                    </p>
                    <p>
                        <strong className='font-medium'>Ends:</strong>{' '}
                        {new Date(gameInstance.endDate).toLocaleDateString()}
                    </p>
                    <p>
                        <strong className='font-medium'>Entry Fee:</strong> £{(gameInstance.entryFee / 100).toFixed(2)}
                    </p>
                    <p>
                        <strong className='font-medium'>Prize Pool:</strong> £
                        {(gameInstance.prizePool / 100).toFixed(2)}
                    </p>
                </CardContent>
            </Card>

            {/* Conditionally render game-specific UI */}
            {game.slug === 'last-man-standing' && (
                <LastManStandingGame
                    gameInstance={gameInstance}
                    fixtures={fixtures}
                    currentRoundId={currentRoundIdToPass} // Use the fetched or fallback ID
                    isSeasonFinished={isSeasonFinished}
                />
            )}

            {game.slug === 'last-man-standing' && (
                <div className='mt-8'>
                    <LastManStandingLeaderboard gameInstanceId={gameInstance.id} />
                </div>
            )}

            {game.slug === 'table-predictor' && (
                <TablePredictorGame gameInstanceId={gameInstance.id} initialTeams={dummyTeams} />
            )}

            {game.slug === 'table-predictor' && (
                <div className='mt-8'>
                    <TablePredictorLeaderboard gameInstanceId={gameInstance.id} teams={dummyTeams} />
                </div>
            )}

            {game.slug === 'weekly-score-predictor' && (
                <WeeklyScorePredictorGame gameInstanceId={gameInstance.id} initialFixtures={dummyWeeklyFixtures} />
            )}

            {game.slug === 'weekly-score-predictor' && (
                <div className='mt-8'>
                    <WeeklyScorePredictorLeaderboard gameInstanceId={gameInstance.id} />
                    {/* fixtures prop removed as it's no longer accepted by the component */}
                </div>
            )}

            {game.slug === 'race-to-33' && <RaceTo33Game gameInstanceId={gameInstance.id} />}

            {game.slug === 'race-to-33' && (
                <div className='mt-8'>
                    <RaceTo33Leaderboard gameInstanceId={gameInstance.id} />
                </div>
            )}
        </div>
    );
}

import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const gameInstanceId = searchParams.get('gameInstanceId');

    console.log('Weekly Score Predictor Debug Leaderboard API: Received gameInstanceId:', gameInstanceId);

    if (!gameInstanceId) {
        console.error('Weekly Score Predictor Debug Leaderboard API: Missing gameInstanceId.');

        return NextResponse.json({ message: 'Missing gameInstanceId' }, { status: 400 });
    }

    try {
        const leaderboardEntries = await prisma.weeklyScorePrediction.findMany({
            where: {
                userGameEntry: {
                    gameInstanceId: gameInstanceId,
                    status: {
                        in: ['ACTIVE', 'COMPLETED'] // Only show active or completed entries
                    }
                }
            },
            select: {
                id: true,
                pointsAwarded: true,
                fixtureId: true,
                predictedHomeScore: true,
                predictedAwayScore: true,
                userGameEntry: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                pointsAwarded: 'desc' // Order by points, highest first
            }
        });

        console.log('Weekly Score Predictor Debug Leaderboard API: Fetched entries:', leaderboardEntries);

        // Format the output for the leaderboard
        const formattedLeaderboard = leaderboardEntries.map((entry) => ({
            predictionId: entry.id,
            userId: entry.userGameEntry.user.id,
            userName: entry.userGameEntry.user.name || entry.userGameEntry.user.username || 'Anonymous',
            pointsAwarded: entry.pointsAwarded,
            fixtureId: entry.fixtureId,
            predictedHomeScore: entry.predictedHomeScore,
            predictedAwayScore: entry.predictedAwayScore
        }));

        console.log('Weekly Score Predictor Debug Leaderboard API: Formatted leaderboard:', formattedLeaderboard);

        return NextResponse.json(formattedLeaderboard, { status: 200 });
    } catch (error) {
        console.error('Error fetching Weekly Score Predictor debug leaderboard:', error);

        return NextResponse.json(
            { message: 'Failed to fetch debug leaderboard', details: (error as Error).message },
            { status: 500 }
        );
    }
}

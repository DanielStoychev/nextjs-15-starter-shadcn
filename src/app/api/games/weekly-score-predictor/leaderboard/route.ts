import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const gameInstanceId = searchParams.get('gameInstanceId');

    console.log('Weekly Score Predictor Leaderboard API: Received gameInstanceId:', gameInstanceId);

    if (!gameInstanceId) {
        console.error('Weekly Score Predictor Leaderboard API: Missing gameInstanceId.');

        return NextResponse.json({ message: 'Missing gameInstanceId' }, { status: 400 });
    }

    try {
        const userEntriesWithScores = await prisma.userGameEntry.findMany({
            where: {
                gameInstanceId: gameInstanceId,
                status: { in: ['ACTIVE', 'COMPLETED'] }
            },
            select: {
                userId: true,
                user: {
                    select: {
                        id: true, // Ensure user.id is selected
                        name: true,
                        username: true
                    }
                },
                weeklyScorePredictions: {
                    select: {
                        pointsAwarded: true
                    },
                    where: {
                        pointsAwarded: { not: null } // Only sum scored predictions
                    }
                }
            }
        });

        console.log('Weekly Score Predictor Leaderboard API: Fetched user entries with scores:', userEntriesWithScores);

        // Aggregate points and format for the leaderboard
        const processedEntries = userEntriesWithScores.map((entry) => {
            const totalPoints = entry.weeklyScorePredictions.reduce((sum, prediction) => {
                return sum + (prediction.pointsAwarded || 0);
            }, 0);

            return {
                userId: entry.user.id,
                userName: entry.user.name || entry.user.username || 'Anonymous',
                totalPoints: totalPoints,
                numberOfPredictions: entry.weeklyScorePredictions.length // Keep track of prediction count for filtering
            };
        });

        const aggregatedLeaderboard = processedEntries
            .filter((entry) => entry.totalPoints > 0 || entry.numberOfPredictions > 0) // Filter users who made predictions or scored points
            .map(({ userId, userName, totalPoints }) => ({
                // Map to final shape, excluding numberOfPredictions
                userId,
                userName,
                totalPoints
            }))
            .sort((a, b) => b.totalPoints - a.totalPoints); // Sort by totalPoints descending

        console.log('Weekly Score Predictor Leaderboard API: Aggregated leaderboard:', aggregatedLeaderboard);

        return NextResponse.json(aggregatedLeaderboard, { status: 200 });
    } catch (error) {
        console.error('Error fetching Weekly Score Predictor leaderboard:', error);

        return NextResponse.json(
            { message: 'Failed to fetch leaderboard', details: (error as Error).message },
            { status: 500 }
        );
    }
}
// Helper type for clarity if needed, though direct mapping is also fine
// interface AggregatedLeaderboardEntry {
//     userId: string;
//     userName: string;
//     totalPoints: number;
// }

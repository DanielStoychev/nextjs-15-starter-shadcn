import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const gameInstanceId = searchParams.get('gameInstanceId');

    if (!gameInstanceId) {
        return NextResponse.json({ message: 'Missing gameInstanceId' }, { status: 400 });
    }

    try {
        const leaderboardEntries = await prisma.tablePredictorPrediction.findMany({
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
                score: true,
                predictedOrder: true,
                predictedTotalGoals: true,
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
                score: 'desc' // Order by score, highest first
            }
        });

        // Format the output for the leaderboard
        const formattedLeaderboard = leaderboardEntries.map((entry) => ({
            predictionId: entry.id,
            userId: entry.userGameEntry.user.id,
            userName: entry.userGameEntry.user.name || entry.userGameEntry.user.username || 'Anonymous',
            score: entry.score,
            predictedOrder: entry.predictedOrder,
            predictedTotalGoals: entry.predictedTotalGoals
        }));

        return NextResponse.json(formattedLeaderboard, { status: 200 });
    } catch (error) {
        console.error('Error fetching Table Predictor leaderboard:', error);

        return NextResponse.json(
            { message: 'Failed to fetch leaderboard', details: (error as Error).message },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Role } from '@/generated/prisma';
// Assuming this is the correct path
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth/next';

// Import Role enum if not already globally available via Prisma client

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === Role.ADMIN;

    // Access is now public, but data shown depends on role
    // The admin check will be used later to format the response

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

        // Format the output for the leaderboard based on user role
        const formattedLeaderboard = leaderboardEntries.map((entry) => {
            const baseEntry = {
                predictionId: entry.id, // Useful for keys in UI
                userId: entry.userGameEntry.user.id,
                userName: entry.userGameEntry.user.name || entry.userGameEntry.user.username || 'Anonymous',
                score: entry.score
            };

            if (isAdmin) {
                return {
                    ...baseEntry,
                    predictedOrder: entry.predictedOrder,
                    predictedTotalGoals: entry.predictedTotalGoals
                };
            }
            // For non-admins, only return anonymized data (user and score)
            return baseEntry;
        });

        return NextResponse.json(formattedLeaderboard, { status: 200 });
    } catch (error) {
        console.error('Error fetching Table Predictor leaderboard:', error);

        return NextResponse.json(
            { message: 'Failed to fetch leaderboard', details: (error as Error).message },
            { status: 500 }
        );
    }
}

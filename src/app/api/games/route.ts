import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandling } from '@/lib/api-utils';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
    return withErrorHandling(async () => {
        // Get session for user-specific data
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        // Simple query - get all games
        const games = await prisma.game.findMany({
            include: {
                gameInstances: {
                    include: {
                        userEntries: {
                            select: {
                                id: true,
                                userId: true,
                                status: true,
                                currentScore: true
                            }
                        }
                    }
                }
            }
        });

        // Transform the data
        const processedGames = games.map((game: any) => {
            const processedInstances = game.gameInstances.map((instance: any) => {
                const participantCount = instance.userEntries?.length || 0;
                const userEntry = userId ? instance.userEntries?.find((entry: any) => entry.userId === userId) : null;

                // Calculate dynamic prize pool (80% of total entry fees from active participants)
                const activeParticipants =
                    instance.userEntries?.filter((entry: any) => entry.status === 'ACTIVE').length || 0;
                const dynamicPrizePool = (activeParticipants * instance.entryFee * 0.8) / 100; // Convert from pence to pounds

                return {
                    id: instance.id,
                    name: instance.name,
                    startDate: instance.startDate,
                    endDate: instance.endDate,
                    entryDeadline: instance.entryDeadline,
                    entryFee: instance.entryFee,
                    maxParticipants: instance.maxParticipants,
                    prizePool: dynamicPrizePool, // Use calculated prize pool instead of stored value
                    status: instance.status,
                    participantCount,
                    userEntry: userEntry
                        ? {
                              id: userEntry.id,
                              status: userEntry.status
                          }
                        : null
                };
            });

            return {
                id: game.id,
                name: game.name,
                description: game.description,
                slug: game.slug,
                difficulty: game.difficulty,
                gameInstances: processedInstances
            };
        });

        return {
            games: processedGames,
            stats: {
                totalGames: processedGames.length,
                activeInstances: processedGames.reduce(
                    (acc, game) =>
                        acc +
                        game.gameInstances.filter(
                            (instance: any) => instance.status === 'ACTIVE' || instance.status === 'PENDING'
                        ).length,
                    0
                ),
                totalPrizePool: 0,
                totalParticipants: processedGames.reduce(
                    (acc, game) =>
                        acc +
                        game.gameInstances.reduce((instAcc: number, inst: any) => instAcc + inst.participantCount, 0),
                    0
                )
            }
        };
    });
}

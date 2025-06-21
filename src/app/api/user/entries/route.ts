import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';
import { GameStatus, UserGameEntryStatus } from '@prisma/client';

import { getServerSession } from 'next-auth';

// API route to get user's game entries
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 User Entries API - Starting...');

        // Check authentication
        const session = await getServerSession(authOptions);

        console.log('🔍 User Entries API - Session check:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email
        });

        if (!session || !session.user?.id) {
            console.log('❌ User Entries API - Unauthorized request');

            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        console.log(`📊 User Entries API - Processing for user: ${userId}`);

        const url = new URL(request.url);

        // Get query parameters for filtering
        const status = url.searchParams.get('status') || 'all';
        const sortBy = url.searchParams.get('sortBy') || 'createdAt';
        const order = url.searchParams.get('order') || 'desc';

        // Build query
        const query: any = {
            where: { userId },
            include: {
                gameInstance: {
                    include: {
                        game: {
                            select: {
                                id: true,
                                name: true,
                                slug: true
                            }
                        },
                        userEntries: {
                            select: {
                                status: true
                            }
                        },
                        _count: {
                            select: {
                                userEntries: true
                            }
                        }
                    }
                }
            }
        };

        // Add status filter if provided
        if (status !== 'all') {
            // Convert status to uppercase to match enum values
            query.where.status = status.toUpperCase() as UserGameEntryStatus;
        }

        // Add sorting
        query.orderBy = {};

        // Handle different sort fields
        if (sortBy === 'gameName') {
            query.orderBy = { gameInstance: { game: { name: order } } };
        } else if (sortBy === 'instanceName') {
            query.orderBy = { gameInstance: { name: order } };
        } else if (sortBy === 'status') {
            query.orderBy = { status: order };
        } else if (sortBy === 'entryFee') {
            query.orderBy = { gameInstance: { entryFee: order } };
        } else if (sortBy === 'prizePool') {
            query.orderBy = { gameInstance: { prizePool: order } };
        } else if (sortBy === 'startDate') {
            query.orderBy = { gameInstance: { startDate: order } };
        } else if (sortBy === 'endDate') {
            query.orderBy = { gameInstance: { endDate: order } };
        } else {
            query.orderBy = { createdAt: order };
        }

        // Get user game entries
        const userGameEntries = await prisma.userGameEntry.findMany(query);

        console.log(`🎮 User Entries API - Found ${userGameEntries.length} entries for user ${userId}`);
        userGameEntries.forEach((entry, index) => {
            console.log(`   ${index + 1}. Status: ${entry.status}, Game: ${(entry as any).gameInstance.game.name}`);
        }); // Process data for frontend
        const processedEntries = userGameEntries.map((entry) => {
            // TypeScript doesn't recognize the included relations, so we need to use "as any"
            const gameInstance = (entry as any).gameInstance;

            // Calculate dynamic prize pool based on active participants
            const activeParticipants = gameInstance.userEntries?.filter((e: any) => e.status === 'ACTIVE').length || 0;
            const prizePool = (gameInstance.entryFee * activeParticipants * 0.8) / 100; // 80% of entry fees from active participants

            // Potential winnings based on position
            let potentialWinnings = 0;
            if (entry.status === 'ACTIVE' || entry.status === 'PENDING_PAYMENT') {
                // For active games, show potential winnings
                potentialWinnings = prizePool;
            } else if (entry.status === 'COMPLETED' && entry.currentScore > 0) {
                // For completed games, calculate actual winnings based on score
                // This is a simplified calculation; you might want to adjust based on your actual prize distribution rules
                potentialWinnings = (entry.currentScore / 100) * prizePool;
            }
            const game = gameInstance.game;

            return {
                id: entry.id,
                gameName: game.name,
                instanceName: gameInstance.name,
                gameInstanceId: entry.gameInstanceId,
                gameSlug: game.slug,
                status: entry.status,
                entryFee: `£${(gameInstance.entryFee / 100).toFixed(2)}`,
                prizePool: `£${prizePool.toFixed(2)}`,
                currentScore: entry.currentScore,
                potentialWinnings: `£${potentialWinnings.toFixed(2)}`,
                startDate: gameInstance.startDate,
                endDate: gameInstance.endDate,
                gameStatus: gameInstance.status,
                createdAt: entry.createdAt
            };
        });

        // Calculate statistics
        const activeEntriesCount = processedEntries.filter(
            (entry) => entry.status === 'ACTIVE' || entry.gameStatus === 'ACTIVE' || entry.gameStatus === 'PENDING'
        ).length;

        const completedEntriesCount = processedEntries.filter(
            (entry) => entry.status === 'COMPLETED' || entry.gameStatus === 'COMPLETED'
        ).length;

        const totalWinnings = processedEntries
            .filter((entry) => entry.status === 'COMPLETED')
            .reduce((total, entry) => {
                // Extract the numeric value from the potentialWinnings string
                const winnings = parseFloat(entry.potentialWinnings.replace('£', ''));

                return total + (isNaN(winnings) ? 0 : winnings);
            }, 0);

        const result = {
            entries: processedEntries,
            stats: {
                totalEntries: processedEntries.length,
                activeEntries: activeEntriesCount,
                completedEntries: completedEntriesCount,
                totalWinnings: `£${totalWinnings.toFixed(2)}`
            }
        };

        console.log(`📋 User Entries API - Final result:`, {
            entriesCount: result.entries.length,
            statsTotal: result.stats.totalEntries,
            statsActive: result.stats.activeEntries,
            userId: userId
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ User Entries API - Error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

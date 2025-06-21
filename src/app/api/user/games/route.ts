import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';
import { GameStatus, UserGameEntryStatus } from '@prisma/client';

import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401
            });
        }

        const userId = session.user.id;
        const url = new URL(req.url);
        const statusFilter = url.searchParams.get('status') || 'all';

        let statusCondition = {};

        if (statusFilter === 'active') {
            statusCondition = {
                gameInstance: {
                    status: {
                        in: [GameStatus.ACTIVE, GameStatus.PENDING]
                    }
                }
            };
        } else if (statusFilter === 'completed') {
            statusCondition = {
                gameInstance: {
                    status: GameStatus.COMPLETED
                }
            };
        } else if (statusFilter === 'upcoming') {
            statusCondition = {
                gameInstance: {
                    status: GameStatus.PENDING
                }
            };
        }

        // Get user entries based on filter
        const userEntries = await prisma.userGameEntry.findMany({
            where: {
                userId: userId,
                ...statusCondition
            },
            include: {
                gameInstance: {
                    include: {
                        game: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform data for client
        const games = userEntries.map((entry) => {
            return {
                id: entry.id,
                gameId: entry.gameInstance.gameId,
                gameInstanceId: entry.gameInstanceId,
                gameName: entry.gameInstance.game.name,
                instanceName: entry.gameInstance.name,
                status: entry.gameInstance.status,
                userStatus: entry.status,
                startDate: entry.gameInstance.startDate,
                endDate: entry.gameInstance.endDate,
                entryFee: entry.gameInstance.entryFee / 100, // Convert to dollars/pounds
                currentScore: entry.currentScore,
                imgUrl: `/images/${entry.gameInstance.game.slug}-thumbnail.png` // Assumed naming convention
            };
        });

        return NextResponse.json({ games });
    } catch (error) {
        console.error('Error fetching user games:', error);

        return new NextResponse(JSON.stringify({ error: 'Failed to fetch user games' }), { status: 500 });
    }
}

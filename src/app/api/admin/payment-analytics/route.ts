import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user || user.role !== Role.ADMIN) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Get payment analytics data
        const analytics = await getPaymentAnalytics();

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching payment analytics:', error);

        return NextResponse.json({ error: 'Failed to fetch payment analytics' }, { status: 500 });
    }
}

async function getPaymentAnalytics() {
    // Get revenue breakdown by game
    const gameRevenue = await prisma.gameInstance.findMany({
        include: {
            game: true,
            userEntries: {
                where: {
                    status: 'ACTIVE'
                }
            },
            _count: {
                select: {
                    userEntries: {
                        where: {
                            status: 'ACTIVE'
                        }
                    }
                }
            }
        }
    });

    // Calculate revenue for each game
    const revenueByGame = gameRevenue.map((instance) => ({
        gameId: instance.game.id,
        gameName: instance.game.name,
        instanceName: instance.name,
        entryFee: instance.entryFee,
        totalEntries: instance._count.userEntries,
        totalRevenue: instance.entryFee * instance._count.userEntries
    }));

    // Get user entry statistics
    const userStats = await prisma.userGameEntry.groupBy({
        by: ['status'],
        _count: {
            status: true
        }
    });

    // Get recent transactions (last 50)
    const recentTransactions = await prisma.userGameEntry.findMany({
        where: {
            status: 'ACTIVE'
        },
        include: {
            user: {
                select: {
                    email: true,
                    username: true
                }
            },
            gameInstance: {
                include: {
                    game: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        },
        take: 50
    });

    // Calculate totals
    const totalRevenue = revenueByGame.reduce((sum, game) => sum + game.totalRevenue, 0);
    const totalActiveEntries = userStats.find((stat) => stat.status === 'ACTIVE')?._count.status || 0;
    const totalPendingEntries = userStats.find((stat) => stat.status === 'PENDING_PAYMENT')?._count.status || 0;

    return {
        summary: {
            totalRevenue: totalRevenue,
            totalActiveEntries: totalActiveEntries,
            totalPendingEntries: totalPendingEntries,
            averageRevenuePerEntry: totalActiveEntries > 0 ? totalRevenue / totalActiveEntries : 0
        },
        revenueByGame: revenueByGame,
        userStats: userStats,
        recentTransactions: recentTransactions.map((transaction) => ({
            id: transaction.id,
            userEmail: transaction.user.email,
            userName: transaction.user.username,
            gameName: transaction.gameInstance.game.name,
            instanceName: transaction.gameInstance.name,
            entryFee: transaction.gameInstance.entryFee,
            status: transaction.status,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt
        }))
    };
}

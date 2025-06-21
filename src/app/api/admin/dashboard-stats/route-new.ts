import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7d';

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (range) {
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Get basic counts
        const totalGames = await prisma.gameInstance.count();
        const activeGames = await prisma.gameInstance.count({
            where: {
                status: { in: ['PENDING', 'ACTIVE'] }
            }
        });
        const totalUsers = await prisma.user.count();
        const totalEntries = await prisma.userGameEntry.count({
            where: {
                createdAt: { gte: startDate }
            }
        });

        // Get revenue calculation
        const entriesWithRevenue = await prisma.userGameEntry.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: startDate }
            },
            include: {
                gameInstance: {
                    select: { entryFee: true }
                }
            }
        });
        const totalRevenue = entriesWithRevenue.reduce((sum, entry) => sum + entry.gameInstance.entryFee, 0);

        // Get recent entries for activity feed
        const recentEntries = await prisma.userGameEntry.findMany({
            where: {
                createdAt: { gte: startDate }
            },
            include: {
                user: {
                    select: { name: true, email: true }
                },
                gameInstance: {
                    include: {
                        game: {
                            select: { name: true, slug: true }
                        }
                    },
                    select: { entryFee: true, game: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Get game statistics
        const gameStats = await prisma.gameInstance.groupBy({
            by: ['gameId'],
            _count: {
                id: true
            },
            where: {
                startDate: { gte: startDate }
            }
        });

        // Get game names for game stats
        const gameIds = gameStats.map((stat: any) => stat.gameId);
        const games = await prisma.game.findMany({
            where: { id: { in: gameIds } },
            select: { id: true, name: true, slug: true }
        });

        const gameStatsWithNames = gameStats.map((stat: any) => {
            const game = games.find((g: any) => g.id === stat.gameId);

            return {
                gameId: stat.gameId,
                gameName: game?.name || 'Unknown Game',
                gameSlug: game?.slug || '',
                instanceCount: stat._count.id,
                totalEntries: 0 // We'll calculate this separately if needed
            };
        });

        // Get chart data using raw queries for better type safety
        const revenueByDay = (await prisma.$queryRaw`
      SELECT DATE(uge."createdAt") as date, SUM(gi."entryFee")::int as revenue
      FROM "UserGameEntry" uge
      JOIN "GameInstance" gi ON uge."gameInstanceId" = gi.id
      WHERE uge.status = 'COMPLETED' AND uge."createdAt" >= ${startDate}
      GROUP BY DATE(uge."createdAt")
      ORDER BY DATE(uge."createdAt") ASC
    `) as any[];

        const userGrowth = (await prisma.$queryRaw`
      SELECT DATE(u."createdAt") as date, COUNT(*)::int as count
      FROM "User" u
      WHERE u."createdAt" >= ${startDate}
      GROUP BY DATE(u."createdAt")
      ORDER BY DATE(u."createdAt") ASC
    `) as any[];

        // Calculate growth percentages
        const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

        const previousEntriesWithRevenue = await prisma.userGameEntry.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: {
                    gte: previousPeriodStart,
                    lt: startDate
                }
            },
            include: {
                gameInstance: {
                    select: { entryFee: true }
                }
            }
        });
        const previousRevenue = previousEntriesWithRevenue.reduce((sum, entry) => sum + entry.gameInstance.entryFee, 0);

        const previousEntries = await prisma.userGameEntry.count({
            where: {
                createdAt: {
                    gte: previousPeriodStart,
                    lt: startDate
                }
            }
        });

        const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        const entriesGrowth = previousEntries > 0 ? ((totalEntries - previousEntries) / previousEntries) * 100 : 0;

        const response = {
            overview: {
                totalGames,
                activeGames,
                totalUsers,
                totalEntries,
                totalRevenue,
                revenueGrowth: Math.round(revenueGrowth * 100) / 100,
                entriesGrowth: Math.round(entriesGrowth * 100) / 100
            },
            charts: {
                revenueByDay: revenueByDay.map((entry: any) => ({
                    date: entry.date.toISOString().split('T')[0],
                    amount: Number(entry.revenue) || 0
                })),
                userGrowth: userGrowth.map((entry: any) => ({
                    date: entry.date.toISOString().split('T')[0],
                    count: Number(entry.count) || 0
                }))
            },
            gameStats: gameStatsWithNames.sort((a: any, b: any) => b.instanceCount - a.instanceCount),
            recentActivity: recentEntries.map((entry: any) => ({
                id: entry.id,
                userName: entry.user.name || entry.user.email,
                gameName: entry.gameInstance.game.name,
                gameSlug: entry.gameInstance.game.slug,
                entryFee: entry.gameInstance.entryFee,
                status: entry.status,
                createdAt: entry.createdAt
            })),
            dateRange: {
                start: startDate,
                end: now,
                period: range
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Dashboard stats error:', error);

        return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
    }
}

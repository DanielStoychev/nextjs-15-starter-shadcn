// Test script for dashboard stats database queries
import prisma from './src/lib/prisma.js';

const testDashboardStats = async () => {
    try {
        console.log('Testing dashboard stats database queries...');

        const now = new Date();
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        console.log('Date range:', startDate.toISOString(), 'to', now.toISOString());

        // Test basic counts
        const totalGames = await prisma.gameInstance.count();
        console.log('Total games:', totalGames);

        const activeGames = await prisma.gameInstance.count({
            where: {
                status: { in: ['PENDING', 'ACTIVE'] }
            }
        });
        console.log('Active games:', activeGames);

        const totalUsers = await prisma.user.count();
        console.log('Total users:', totalUsers);

        const totalEntries = await prisma.userGameEntry.count({
            where: {
                createdAt: { gte: startDate }
            }
        });
        console.log('Total entries (last 7 days):', totalEntries);

        // Test revenue calculation
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
        console.log('Total revenue (last 7 days):', totalRevenue, 'pence');

        // Test recent entries (the problematic query)
        console.log('Testing recent entries query...');
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
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        console.log('Recent entries found:', recentEntries.length);
        if (recentEntries.length > 0) {
            console.log('Sample entry:', {
                id: recentEntries[0].id,
                userName: recentEntries[0].user.name || recentEntries[0].user.email,
                gameName: recentEntries[0].gameInstance.game.name,
                entryFee: recentEntries[0].gameInstance.entryFee,
                status: recentEntries[0].status
            });
        }

        console.log('All database queries successful!');
    } catch (error) {
        console.error('Error testing dashboard stats:', error);
    } finally {
        await prisma.$disconnect();
    }
};

testDashboardStats();

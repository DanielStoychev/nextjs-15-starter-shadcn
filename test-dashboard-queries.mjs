#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDashboardQueries() {
    try {
        console.log('Testing dashboard stats queries...');

        const now = new Date();
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        console.log('Date range:', startDate.toISOString(), 'to', now.toISOString());

        // Test basic counts
        const totalGames = await prisma.gameInstance.count();
        console.log('✓ Total games:', totalGames);

        const activeGames = await prisma.gameInstance.count({
            where: {
                status: { in: ['PENDING', 'ACTIVE'] }
            }
        });
        console.log('✓ Active games:', activeGames);

        const totalUsers = await prisma.user.count();
        console.log('✓ Total users:', totalUsers);

        const totalEntries = await prisma.userGameEntry.count({
            where: {
                createdAt: { gte: startDate }
            }
        });
        console.log('✓ Total entries (last 7 days):', totalEntries);

        // Test recent entries query (this was causing the error)
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
        console.log('✓ Recent entries found:', recentEntries.length);

        console.log('✅ All dashboard queries successful!');
    } catch (error) {
        console.error('❌ Error testing dashboard stats:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDashboardQueries();

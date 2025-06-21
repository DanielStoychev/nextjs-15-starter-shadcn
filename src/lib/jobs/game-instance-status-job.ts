/**
 * Game Instance Status Job
 * Automatically manages game instance status transitions
 */
import { notifyGameStart } from '@/lib/notification-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function gameInstanceStatusJob(): Promise<void> {
    console.log('🔄 Starting game instance status job...');

    try {
        const now = new Date();

        // Start pending games that should be active
        await startPendingGames(now);

        // Complete active games that have ended
        await completeActiveGames(now);

        // Archive old completed games
        await archiveOldGames(now);

        console.log('✅ Game instance status job completed');
    } catch (error) {
        console.error('❌ Game instance status job failed:', error);
        throw error;
    }
}

async function startPendingGames(now: Date): Promise<void> {
    // Find pending games that should now be active
    const gamesToStart = await prisma.gameInstance.findMany({
        where: {
            status: 'PENDING',
            startDate: { lte: now }
        }
    });

    for (const game of gamesToStart) {
        await prisma.gameInstance.update({
            where: { id: game.id },
            data: { status: 'ACTIVE' }
        });

        console.log(`✅ Started game instance: ${game.name}`);

        // Trigger game start notifications
        await notifyGameStart(game.id);
    }

    if (gamesToStart.length > 0) {
        console.log(`Started ${gamesToStart.length} game instances`);
    }
}

async function completeActiveGames(now: Date): Promise<void> {
    // Find active games that should now be completed
    const gamesToComplete = await prisma.gameInstance.findMany({
        where: {
            status: 'ACTIVE',
            endDate: { lte: now }
        }
    });

    for (const game of gamesToComplete) {
        await prisma.gameInstance.update({
            where: { id: game.id },
            data: { status: 'COMPLETED' }
        });

        console.log(`✅ Completed game instance: ${game.name}`);
    }

    if (gamesToComplete.length > 0) {
        console.log(`Completed ${gamesToComplete.length} game instances`);
    }
}

async function archiveOldGames(now: Date): Promise<void> {
    // Archive games that have been completed for more than 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const gamesToArchive = await prisma.gameInstance.findMany({
        where: {
            status: 'COMPLETED',
            endDate: { lte: thirtyDaysAgo }
        }
    });

    for (const game of gamesToArchive) {
        await prisma.gameInstance.update({
            where: { id: game.id },
            data: { status: 'ARCHIVED' }
        });

        console.log(`📦 Archived game instance: ${game.name}`);
    }

    if (gamesToArchive.length > 0) {
        console.log(`Archived ${gamesToArchive.length} game instances`);
    }
}

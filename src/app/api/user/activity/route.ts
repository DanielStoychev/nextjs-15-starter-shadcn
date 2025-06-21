import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

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

        // Get user entries for activity related to games
        const userEntries = await prisma.userGameEntry.findMany({
            where: {
                userId: userId
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
            },
            take: 10 // Limit to most recent 10
        });

        // Get user orders for payment activities
        const orders = await prisma.order.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5 // Limit to most recent 5
        });

        // Generate activity items
        const gameActivities = userEntries.map((entry) => ({
            id: `game-${entry.id}`,
            type: 'game',
            title: getActivityTitle(entry),
            description: getActivityDescription(entry),
            date: entry.updatedAt || entry.createdAt,
            gameId: entry.gameInstance.gameId,
            gameInstanceId: entry.gameInstanceId,
            gameName: entry.gameInstance.game.name,
            instanceName: entry.gameInstance.name,
            status: entry.status
        }));

        const paymentActivities = orders.map((order) => ({
            id: `payment-${order.id}`,
            type: 'payment',
            title: 'Payment Processed',
            description: `Payment of £${(order.amount / 100).toFixed(2)} completed for game entry`,
            date: order.createdAt,
            status: order.status,
            amount: order.amount / 100
        }));

        // Combine and sort all activities by date
        const allActivities = [...gameActivities, ...paymentActivities]
            .sort((a, b) => {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            })
            .slice(0, 15); // Keep only the most recent 15 activities

        return NextResponse.json({ activities: allActivities });
    } catch (error) {
        console.error('Error fetching user activity:', error);

        return new NextResponse(JSON.stringify({ error: 'Failed to fetch user activity' }), { status: 500 });
    }
}

// Helper functions to generate activity titles and descriptions
function getActivityTitle(entry: any): string {
    const gameName = entry.gameInstance.game.name;
    const instanceName = entry.gameInstance.name;

    switch (entry.status) {
        case 'ACTIVE':
            return `Joined ${gameName}`;
        case 'ELIMINATED':
            return `Eliminated from ${gameName}`;
        case 'COMPLETED':
            return `Completed ${gameName}`;
        case 'BUST':
            return `Lost in ${gameName}`;
        case 'PENDING_PAYMENT':
            return `Started joining ${gameName}`;
        default:
            return `Activity in ${gameName}`;
    }
}

function getActivityDescription(entry: any): string {
    const gameName = entry.gameInstance.game.name;
    const instanceName = entry.gameInstance.name;

    switch (entry.status) {
        case 'ACTIVE':
            return `You successfully joined ${gameName} (${instanceName}) and are currently active in the competition.`;
        case 'ELIMINATED':
            return `You were eliminated from ${gameName} (${instanceName}). Better luck next time!`;
        case 'COMPLETED':
            return `You completed ${gameName} (${instanceName}) with a score of ${entry.currentScore}.`;
        case 'BUST':
            return `You didn't make it in ${gameName} (${instanceName}). Try again in the next game!`;
        case 'PENDING_PAYMENT':
            return `Your entry for ${gameName} (${instanceName}) is awaiting payment to be confirmed.`;
        default:
            return `You have activity in ${gameName} (${instanceName}).`;
    }
}

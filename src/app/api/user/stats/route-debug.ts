import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
    try {
        console.log('🔍 User Stats API - Starting...');

        const session = await getServerSession(authOptions);

        console.log('🔍 User Stats API - Session check:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email
        });

        if (!session || !session.user?.id) {
            console.log('❌ User Stats API - Unauthorized request');

            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        console.log(`📊 User Stats API - Processing for user: ${userId}`);

        // Get order history
        const orders = await prisma.order.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`📦 User Stats API - Found ${orders.length} orders`);
        orders.forEach((order, index) => {
            console.log(`   ${index + 1}. Status: ${order.status}, Amount: ${order.amount} pence`);
        });

        // Calculate total spent
        const totalSpent = orders.reduce((acc: number, order: any) => {
            if (order.status === 'COMPLETED') {
                console.log(`💰 Adding ${order.amount} pence to total (was ${acc})`);

                return acc + (order.amount || 0);
            }

            return acc;
        }, 0);

        console.log(`💷 User Stats API - Total spent: ${totalSpent} pence (£${(totalSpent / 100).toFixed(2)})`);

        const result = {
            totalSpent: Number((totalSpent / 100).toFixed(2)) || 0,
            gamesPlayed: 0,
            gamesWon: 0,
            activeGames: 0,
            winRate: 0,
            bestRank: 0,
            totalEarnings: 0,
            favoriteGame: 'None',
            recentPerformance: []
        };

        console.log(`📋 User Stats API - Final result:`, {
            totalSpent: result.totalSpent,
            userId: userId
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ User Stats API - Error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

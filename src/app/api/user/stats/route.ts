import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';
import { GameStatus, UserGameEntryStatus } from '@prisma/client';

import { getServerSession } from 'next-auth';

// Define GET method for the API endpoint
export async function GET(req: NextRequest) {
    try {
        console.log('🔍 User Stats API - Starting...');

        const session = await getServerSession(authOptions);

        console.log('🔍 User Stats API - Session check:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            userName: session?.user?.name
        });

        if (!session || !session.user?.id) {
            console.log('❌ User Stats API - Unauthorized request');

            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        console.log(`📊 User Stats API - Processing for user: ${userId}`);

        // Get user entries
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
            }
        });

        console.log(`🎮 User Stats API - Found ${userEntries.length} user entries`);

        // Get order history instead of payments
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

        // Calculate games played
        const completedGames = userEntries.filter((entry) => entry.gameInstance.status === GameStatus.COMPLETED).length;
        const activeGames = userEntries.filter(
            (entry) =>
                entry.gameInstance.status === GameStatus.ACTIVE || entry.gameInstance.status === GameStatus.PENDING
        ).length;

        // More accurate calculation for games won
        // A game is considered won if the user finished in first place in a completed game
        const gamesWon = userEntries.filter(
            (entry: any) => entry.gameInstance.status === GameStatus.COMPLETED && entry.currentPosition === 1
        ).length;

        // Calculate win rate only from completed games
        const winRate = completedGames > 0 ? (gamesWon / completedGames) * 100 : 0;

        // Calculate total earnings based on completed games and position
        const totalEarnings = userEntries.reduce((acc: number, entry: any) => {
            if (entry.status === UserGameEntryStatus.COMPLETED && entry.currentPosition === 1) {
                // Winner gets the prize pool (simplified calculation)
                const estimatedWinnings = entry.gameInstance.entryFee * entry.gameInstance.maxParticipants * 0.9; // 90% of total pool

                return acc + estimatedWinnings;
            } else if (entry.status === UserGameEntryStatus.COMPLETED && entry.currentPosition === 2) {
                // Runner-up gets a smaller prize
                const estimatedWinnings = entry.gameInstance.entryFee * entry.gameInstance.maxParticipants * 0.1; // 10% of total pool

                return acc + estimatedWinnings;
            }

            return acc;
        }, 0);

        // Find best rank (lowest position number is better)
        const positions = userEntries
            .filter((entry: any) => entry.currentPosition > 0)
            .map((entry: any) => entry.currentPosition);

        const bestRank = positions.length > 0 ? Math.min(...positions) : 0;

        // Get favorite game type from name instead of gameType
        const gameNameCounts: Record<string, number> = {};
        userEntries.forEach((entry) => {
            const gameName = entry.gameInstance.game.name;
            gameNameCounts[gameName] = (gameNameCounts[gameName] || 0) + 1;
        });

        let favoriteGame = 'None';
        let maxCount = 0;
        for (const [gameName, count] of Object.entries(gameNameCounts)) {
            if (count > maxCount) {
                favoriteGame = gameName;
                maxCount = count;
            }
        }

        // Calculate recent performance (last 5 games)
        const recentGames = userEntries
            .filter((entry) => entry.gameInstance.status === GameStatus.COMPLETED)
            .sort(
                (a, b) =>
                    new Date(b.gameInstance.endDate || 0).getTime() - new Date(a.gameInstance.endDate || 0).getTime()
            )
            .slice(0, 5);

        const recentPerformance = recentGames.map((entry) => ({
            gameId: entry.gameInstance.gameId,
            gameInstanceId: entry.gameInstanceId,
            gameName: entry.gameInstance.game.name,
            score: entry.currentScore,
            estimatedWinnings:
                entry.currentScore > 0 ? (entry.gameInstance.entryFee * (entry.currentScore / 100)) / 100 : 0,
            date: entry.gameInstance.endDate
        }));

        const result = {
            totalSpent: Number((totalSpent / 100).toFixed(2)) || 0, // Convert from cents to dollars/pounds and ensure it's a number
            gamesPlayed: completedGames || 0,
            gamesWon: gamesWon || 0,
            activeGames: activeGames || 0,
            winRate: Number(winRate.toFixed(1)) || 0,
            bestRank: bestRank || 0,
            totalEarnings: Number((totalEarnings / 100).toFixed(2)) || 0, // Convert from cents to dollars/pounds and ensure it's a number
            favoriteGame: favoriteGame || 'None',
            recentPerformance: recentPerformance || []
        };

        console.log(`📋 User Stats API - Final result:`, {
            totalSpent: result.totalSpent,
            gamesPlayed: result.gamesPlayed,
            activeGames: result.activeGames,
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

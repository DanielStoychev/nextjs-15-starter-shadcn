import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';
import { GameStatus } from '@prisma/client';

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

        // Get user's previous game entries to identify preferences
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
            }
        });

        // Count game types user has played
        const gamePreferences: { [key: string]: number } = {};
        userEntries.forEach((entry) => {
            const gameId = entry.gameInstance.gameId;
            gamePreferences[gameId] = (gamePreferences[gameId] || 0) + 1;
        });

        // Get all active game instances that user is not already part of
        const allActiveGames = await prisma.gameInstance.findMany({
            where: {
                status: {
                    in: [GameStatus.ACTIVE, GameStatus.PENDING]
                },
                NOT: {
                    userEntries: {
                        some: {
                            userId: userId
                        }
                    }
                }
            },
            include: {
                game: true,
                userEntries: {
                    select: {
                        id: true // Just to count participants
                    }
                }
            }
        });

        // Score games based on user preferences and popularity
        const scoredGames = allActiveGames.map((game) => {
            // Base score starts at 10
            let score = 10;

            // Boost score if user has played this type of game before
            const gameTypePreference = gamePreferences[game.gameId] || 0;
            score += gameTypePreference * 5;

            // Boost score for games with more participants (more popular)
            score += Math.min(game.userEntries.length, 10);

            // Boost score for games starting soon
            const now = new Date();
            const daysUntilStart = (new Date(game.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

            if (daysUntilStart < 1) {
                score += 15; // Starting within a day
            } else if (daysUntilStart < 3) {
                score += 10; // Starting within 3 days
            } else if (daysUntilStart < 7) {
                score += 5; // Starting within a week
            }

            return {
                id: game.id,
                gameId: game.gameId,
                name: game.name,
                gameName: game.game.name,
                status: game.status,
                startDate: game.startDate,
                endDate: game.endDate,
                entryFee: game.entryFee / 100, // Convert to dollars/pounds
                participants: game.userEntries.length,
                score: score,
                imgUrl: `/images/${game.game.slug}-thumbnail.png` // Assumed naming convention
            };
        });

        // Sort by score and take top 5
        const recommendations = scoredGames.sort((a, b) => b.score - a.score).slice(0, 5);

        return NextResponse.json({ recommendations });
    } catch (error) {
        console.error('Error fetching recommendations:', error);

        return new NextResponse(JSON.stringify({ error: 'Failed to fetch recommendations' }), { status: 500 });
    }
}

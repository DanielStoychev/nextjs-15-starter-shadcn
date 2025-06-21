import type { Metadata } from 'next';

import Leaderboards from '@/components/leaderboards/leaderboards';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
    title: 'Leaderboards',
    description: 'View the top players and their rankings across various mini-competitions on FootyGames.co.uk.'
};

// Real function to calculate user stats based on actual game data
async function calculateUserStats() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            userGameEntries: {
                select: {
                    id: true,
                    status: true,
                    currentScore: true,
                    createdAt: true,
                    updatedAt: true,
                    gameInstance: {
                        select: {
                            id: true,
                            entryFee: true,
                            prizePool: true,
                            status: true,
                            game: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    return users.map((user) => {
        const entries = user.userGameEntries;
        const totalGames = entries.length;

        // Find completed games
        const completedGames = entries.filter((entry) => entry.gameInstance.status === 'COMPLETED');

        // Calculate wins (entries with status COMPLETED and high score)
        const winningEntries = entries.filter((entry) => entry.status === 'COMPLETED' && entry.currentScore > 0);

        const totalWins = winningEntries.length;

        // Calculate earnings based on game prize pools
        const totalEarnings = winningEntries.reduce((total, entry) => {
            // Calculate earnings as a share of prize pool based on score
            // For simplicity, assume 1st place gets full prize
            if (entry.currentScore >= 100) {
                return total + entry.gameInstance.prizePool / 100; // Convert from cents
            }

            return total;
        }, 0);

        // Calculate win rate from completed games
        const winRate = completedGames.length > 0 ? (totalWins / completedGames.length) * 100 : 0;

        // Calculate average score from completed games
        const scores = completedGames.map((entry) => entry.currentScore);
        const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

        // Determine streak (simplified)
        const currentStreak = 0; // Would need game history to calculate this properly
        const longestStreak = 0; // Would need game history to calculate this properly

        // Find last active date
        const lastActiveDate =
            entries.length > 0
                ? entries.reduce((latest, entry) => (entry.updatedAt > latest ? entry.updatedAt : latest), new Date(0))
                : new Date();

        // Determine favorite game
        const gameFrequency: { [key: string]: number } = {};
        entries.forEach((entry) => {
            const gameName = entry.gameInstance.game.name;
            gameFrequency[gameName] = (gameFrequency[gameName] || 0) + 1;
        });

        const favoriteGame =
            Object.keys(gameFrequency).length > 0
                ? Object.keys(gameFrequency).reduce((a, b) => (gameFrequency[a] > gameFrequency[b] ? a : b))
                : undefined;

        return {
            userId: user.id,
            username: user.name || 'Anonymous',
            email: user.email,
            totalGames,
            totalWins,
            totalEarnings,
            averageScore,
            winRate,
            currentStreak,
            longestStreak,
            lastActiveDate,
            favoriteGame
        };
    });
}

export default async function LeaderboardsPage() {
    const session = await getServerSession(authOptions);
    const userStats = await calculateUserStats();

    return (
        <div className='container mx-auto py-8'>
            <Leaderboards userStats={userStats} currentUserId={session?.user?.id} />
        </div>
    );
}

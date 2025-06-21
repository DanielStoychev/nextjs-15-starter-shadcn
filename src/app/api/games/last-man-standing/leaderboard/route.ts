import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const gameInstanceId = searchParams.get('gameInstanceId');

    if (!gameInstanceId) {
        return NextResponse.json({ message: 'Missing gameInstanceId' }, { status: 400 });
    }

    try {
        const leaderboardEntries = await prisma.userGameEntry.findMany({
            where: {
                gameInstanceId: gameInstanceId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                lastManStandingPicks: {
                    orderBy: {
                        createdAt: 'desc' // Get the most recent pick
                    },
                    take: 1 // Only need the latest pick to determine status
                }
            },
            orderBy: {
                status: 'asc' // Active users first, then eliminated
            }
        });

        // Process data to create a simplified leaderboard structure
        const leaderboard = leaderboardEntries.map((entry) => {
            const latestPick = entry.lastManStandingPicks[0];

            return {
                userId: entry.userId,
                userName: entry.user?.name || 'Unknown User',
                userEmail: entry.user?.email || 'N/A',
                status: entry.status,
                latestPickRoundId: latestPick?.roundId || null,
                latestPickTeamId: latestPick?.pickedTeamId || null,
                latestPickTeamName: null as string | null, // Will be populated below
                latestPickIsCorrect: latestPick?.isCorrect || null
            };
        });

        // Get unique team IDs to fetch team details
        const uniqueTeamIds = leaderboard
            .map((entry) => entry.latestPickTeamId)
            .filter((teamId) => teamId !== null)
            .map((teamId) => parseInt(teamId!, 10))
            .filter((teamId) => !isNaN(teamId));

        // Fetch team details if we have team IDs
        if (uniqueTeamIds.length > 0) {
            const teams = await prisma.team.findMany({
                where: {
                    sportMonksId: {
                        in: uniqueTeamIds
                    }
                },
                select: {
                    sportMonksId: true,
                    name: true
                }
            });

            const teamMap = new Map(teams.map((team) => [team.sportMonksId.toString(), team.name]));

            // Update leaderboard entries with team names
            leaderboard.forEach((entry) => {
                if (entry.latestPickTeamId) {
                    entry.latestPickTeamName = teamMap.get(entry.latestPickTeamId) || 'Unknown Team';
                }
            });
        }

        return NextResponse.json(leaderboard, { status: 200 });
    } catch (error) {
        console.error('Error fetching Last Man Standing leaderboard:', error);

        return NextResponse.json(
            { message: 'Failed to fetch leaderboard', details: (error as Error).message },
            { status: 500 }
        );
    }
}

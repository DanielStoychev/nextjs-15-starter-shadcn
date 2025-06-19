import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId'); // Local DB CUID of the Round
    const gameInstanceId = searchParams.get('gameInstanceId');

    if (!roundId || !gameInstanceId) {
        return NextResponse.json({ message: 'Missing roundId or gameInstanceId parameter' }, { status: 400 });
    }

    try {
        const picksInRound = await prisma.lastManStandingPick.findMany({
            where: {
                roundId: roundId,
                userGameEntry: {
                    gameInstanceId: gameInstanceId
                }
            },
            select: {
                pickedTeamId: true // This is the SportMonks Team ID (string)
            }
        });

        if (picksInRound.length === 0) {
            return NextResponse.json({ percentages: [] }, { status: 200 });
        }

        const pickCounts: Record<string, number> = {};
        for (const pick of picksInRound) {
            pickCounts[pick.pickedTeamId] = (pickCounts[pick.pickedTeamId] || 0) + 1;
        }

        const totalPicks = picksInRound.length;
        const uniquePickedTeamSmIds = Object.keys(pickCounts).map((id) => parseInt(id, 10));

        // Fetch team details for these SportMonks IDs from our local DB
        const teamsDetails = await prisma.team.findMany({
            where: {
                sportMonksId: {
                    in: uniquePickedTeamSmIds
                }
            },
            select: {
                sportMonksId: true,
                name: true,
                logoPath: true
            }
        });

        const teamDetailsMap = new Map(teamsDetails.map((team) => [String(team.sportMonksId), team]));

        const percentages = Object.entries(pickCounts).map(([teamSmId, count]) => {
            const teamDetail = teamDetailsMap.get(teamSmId);

            return {
                teamId: teamSmId, // SportMonks ID
                teamName: teamDetail?.name || 'Unknown Team',
                teamLogo: teamDetail?.logoPath || null,
                count: count,
                percentage: parseFloat(((count / totalPicks) * 100).toFixed(2))
            };
        });

        // Sort by percentage descending
        percentages.sort((a, b) => b.percentage - a.percentage);

        return NextResponse.json({ percentages }, { status: 200 });
    } catch (error) {
        console.error('Error fetching Last Man Standing pick percentages:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return NextResponse.json(
            { message: 'Failed to fetch pick percentages', details: errorMessage },
            { status: 500 }
        );
    }
}

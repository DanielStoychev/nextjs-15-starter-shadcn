import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const gameInstanceId = searchParams.get('gameInstanceId');

        if (!gameInstanceId) {
            return new NextResponse('Missing gameInstanceId', { status: 400 });
        }

        const leaderboard = await prisma.raceTo33Assignment.findMany({
            where: {
                userGameEntry: {
                    gameInstanceId: gameInstanceId
                }
            },
            orderBy: {
                cumulativeGoals: 'asc' // Lower goals are better in Race to 33
            },
            include: {
                userGameEntry: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true
                            }
                        }
                    }
                }
            }
        });

        // Fetch team details for all unique assignedTeamIds across the leaderboard
        const allAssignedTeamIdsStrings = Array.from(new Set(leaderboard.flatMap((entry) => entry.assignedTeamIds)));
        const allAssignedTeamIdsNumbers = allAssignedTeamIdsStrings.map((id) => parseInt(id, 10));

        const teams = await prisma.team.findMany({
            where: {
                sportMonksId: {
                    in: allAssignedTeamIdsNumbers
                }
            },
            select: {
                sportMonksId: true,
                name: true,
                logoPath: true
            }
        });

        const teamMap = new Map(teams.map((team) => [team.sportMonksId, team]));

        // Map assigned teams to each leaderboard entry
        const leaderboardWithTeams = leaderboard.map((entry) => {
            const numericTeamIds = entry.assignedTeamIds.map((id) => parseInt(id, 10));

            return {
                ...entry,
                assignedTeams: numericTeamIds.map((teamId) => teamMap.get(teamId)).filter(Boolean)
            };
        });

        return NextResponse.json(leaderboardWithTeams);
    } catch (error) {
        console.error('Error fetching Race to 33 leaderboard:', error);

        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Ensure session.user.id exists
        if (!session.user.id) {
            console.error('User ID not found in session');

            return NextResponse.json({ message: 'User ID not found in session.' }, { status: 500 });
        }
        const userId = session.user.id;

        const { searchParams } = new URL(request.url);
        const gameInstanceId = searchParams.get('gameInstanceId');

        if (!gameInstanceId) {
            return new NextResponse('Missing gameInstanceId', { status: 400 });
        }

        const userGameEntry = await prisma.userGameEntry.findUnique({
            where: {
                userId_gameInstanceId: {
                    userId: userId,
                    gameInstanceId: gameInstanceId
                }
            },
            select: {
                id: true
            }
        });

        if (!userGameEntry) {
            return NextResponse.json({ message: 'User not entered in this game instance.' }, { status: 404 });
        }

        const assignment = await prisma.raceTo33Assignment.findUnique({
            where: {
                userGameEntryId: userGameEntry.id
            },
            include: {
                // Include assigned teams details
                userGameEntry: {
                    include: {
                        user: true // Include user details if needed
                    }
                }
            }
        });

        if (!assignment) {
            return NextResponse.json(
                { message: 'No Race to 33 assignment found for this user in this game instance.' },
                { status: 404 }
            );
        }

        // Fetch team details for assignedTeamIds
        if (!assignment.assignedTeamIds || assignment.assignedTeamIds.length === 0) {
            console.error('No assigned team IDs found for assignment:', assignment.id);

            return NextResponse.json({ message: 'Assignment found, but no teams are assigned.' }, { status: 404 });
        }

        // assignedTeamIds are stored as String[] in DB, parse to numbers for querying Team.sportMonksId (which is Int)
        const assignedTeamIdsAsNumbers = assignment.assignedTeamIds
            .map((id) => parseInt(id, 10))
            .filter((id) => !isNaN(id));

        if (assignedTeamIdsAsNumbers.length === 0 && assignment.assignedTeamIds.length > 0) {
            console.error(
                'Failed to parse assigned team IDs as numbers for assignment:',
                assignment.id,
                'Original IDs:',
                assignment.assignedTeamIds
            );

            return NextResponse.json({ message: 'Error processing assigned team IDs.' }, { status: 500 });
        }

        const assignedTeams = await prisma.team.findMany({
            where: {
                sportMonksId: {
                    in: assignedTeamIdsAsNumbers
                }
            },
            select: {
                sportMonksId: true,
                name: true,
                logoPath: true
            }
        });

        // Map assigned teams to the assignment object
        const assignmentWithTeams = {
            ...assignment,
            assignedTeams: assignedTeams
        };

        return NextResponse.json(assignmentWithTeams);
    } catch (error: any) {
        // Added type 'any' to error for accessing message property
        console.error('Error fetching Race to 33 status:', error);
        const errorMessage = error.message || 'An unexpected error occurred.';

        return NextResponse.json({ message: `Internal Server Error: ${errorMessage}` }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { assignTeamsToUser } from '@/lib/game-logic/raceTo33Logic';
import prisma from '@/lib/prisma';

// Assuming this logic will be in a separate file

export async function POST(request: Request) {
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

        const { gameInstanceId } = await request.json();

        if (!gameInstanceId) {
            return new NextResponse('Missing gameInstanceId', { status: 400 });
        }

        // Fetch the UserGameEntry first, or create it if it doesn't exist
        let userGameEntry = await prisma.userGameEntry.findUnique({
            where: {
                userId_gameInstanceId: {
                    userId: userId,
                    gameInstanceId: gameInstanceId
                }
            }
        });

        if (!userGameEntry) {
            // If UserGameEntry doesn't exist, create it. This implies joining the game.
            // Ensure the gameInstanceId is valid before creating an entry.
            const gameInstanceExists = await prisma.gameInstance.findUnique({
                where: { id: gameInstanceId }
            });

            if (!gameInstanceExists) {
                return NextResponse.json({ message: 'Game instance not found.' }, { status: 404 });
            }

            try {
                userGameEntry = await prisma.userGameEntry.create({
                    data: {
                        userId: userId,
                        gameInstanceId: gameInstanceId,
                        status: 'ACTIVE' // Set status to ACTIVE upon joining/assigning teams
                    }
                });
                console.log(`Created new UserGameEntry for user ${userId} in game instance ${gameInstanceId}`);
            } catch (e: any) {
                // Handle potential race conditions or other creation errors
                console.error(`Error creating UserGameEntry: ${e.message}`);
                // Re-fetch in case another request created it in the meantime
                userGameEntry = await prisma.userGameEntry.findUnique({
                    where: {
                        userId_gameInstanceId: {
                            userId: userId,
                            gameInstanceId: gameInstanceId
                        }
                    }
                });
                if (!userGameEntry) {
                    return NextResponse.json({ message: 'Failed to create or find user game entry.' }, { status: 500 });
                }
            }
        }

        // Now check if an assignment already exists for this userGameEntry.id
        const existingAssignment = await prisma.raceTo33Assignment.findUnique({
            where: {
                userGameEntryId: userGameEntry.id
            }
        });

        if (existingAssignment) {
            return NextResponse.json({ message: 'Teams already assigned for this game instance.' }, { status: 409 });
        }

        // Assign teams using the game logic function
        const assignedTeamIds = await assignTeamsToUser(gameInstanceId);

        if (!assignedTeamIds || assignedTeamIds.length === 0) {
            // This implies an issue with the assignTeamsToUser logic or data availability
            console.error('assignTeamsToUser returned no teams for gameInstanceId:', gameInstanceId);

            return NextResponse.json(
                { message: 'Failed to assign teams. No teams available or an error occurred.' },
                { status: 500 }
            );
        }

        const newAssignment = await prisma.raceTo33Assignment.create({
            data: {
                userGameEntryId: userGameEntry.id,
                assignedTeamIds: assignedTeamIds, // assignedTeamIds is now string[] from assignTeamsToUser
                cumulativeGoals: 0 // Initialize cumulative goals
            }
        });

        return NextResponse.json(newAssignment);
    } catch (error: any) {
        // Added type 'any' to error for accessing message property
        console.error('Error assigning teams:', error);
        // Ensure a JSON response for errors too
        const errorMessage = error.message || 'An unexpected error occurred.';

        return NextResponse.json({ message: `Internal Server Error: ${errorMessage}` }, { status: 500 });
    }
}

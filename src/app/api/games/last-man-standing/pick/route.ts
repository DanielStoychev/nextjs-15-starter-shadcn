import { NextResponse } from 'next/server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { gameInstanceId, roundId, pickedTeamId } = await request.json();

    if (!gameInstanceId || !roundId || !pickedTeamId) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    try {
        // 1. Find the user's game entry for this instance
        let userGameEntry = await prisma.userGameEntry.findUnique({
            where: {
                userId_gameInstanceId: {
                    userId: session.user.id,
                    gameInstanceId: gameInstanceId
                }
            }
        });

        // If no entry, create one (assuming payment/entry is handled elsewhere)
        // For now, let's assume an entry exists or create a basic one if not.
        if (!userGameEntry) {
            userGameEntry = await prisma.userGameEntry.create({
                data: {
                    userId: session.user.id,
                    gameInstanceId: gameInstanceId,
                    status: 'ACTIVE' // Assuming they are active upon making a pick
                }
            });
        }

        // 2. Check if the user has already picked for this round in this game instance
        const existingPick = await prisma.lastManStandingPick.findUnique({
            where: {
                userGameEntryId_roundId: {
                    userGameEntryId: userGameEntry.id,
                    roundId: roundId
                }
            }
        });

        if (existingPick) {
            return NextResponse.json({ message: 'You have already made a pick for this round.' }, { status: 409 });
        }

        // 3. Check if the picked team has been used before in this game instance (LMS rule)
        const previousPicks = await prisma.lastManStandingPick.findMany({
            where: {
                userGameEntryId: userGameEntry.id,
                isCorrect: true // Only consider correct picks for reuse check
            },
            select: {
                pickedTeamId: true
            }
        });

        const usedTeamIds = previousPicks.map((pick) => pick.pickedTeamId);
        if (usedTeamIds.includes(String(pickedTeamId))) {
            return NextResponse.json(
                { message: 'You cannot pick a team you have already used and won with in this game cycle.' },
                { status: 403 }
            );
        }

        // 4. Save the pick
        await prisma.lastManStandingPick.create({
            data: {
                userGameEntryId: userGameEntry.id,
                roundId: 'cmc0kzbgu0008lojo8utb6pzd', // Use the actual dummy round ID
                pickedTeamId: String(pickedTeamId)
                // isCorrect will be determined by a background job later
            }
        });

        return NextResponse.json({ message: 'Pick submitted successfully!' }, { status: 200 });
    } catch (error) {
        console.error('Error submitting Last Man Standing pick:', error);

        return NextResponse.json(
            { message: 'Failed to submit pick', details: (error as Error).message },
            { status: 500 }
        );
    }
}

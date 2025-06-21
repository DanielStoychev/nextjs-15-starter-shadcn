import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
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

        // 2. Fetch the Round to check its start date (for pick lock time)
        const round = await prisma.round.findUnique({
            where: { id: roundId }, // Assuming roundId is the CUID from our DB
            select: {
                startDate: true,
                fixtures: { select: { matchDate: true }, orderBy: { matchDate: 'asc' }, take: 1 }
            }
        });

        if (!round) {
            return NextResponse.json({ message: 'Round not found.' }, { status: 404 });
        }

        // Determine the lock time: either the round's official start date or the first fixture's matchDate
        let lockTime = round.startDate;
        if (round.fixtures && round.fixtures.length > 0) {
            lockTime = round.fixtures[0].matchDate;
        }

        if (new Date() > new Date(lockTime)) {
            return NextResponse.json(
                { message: 'Picks are locked for this round. Changes are no longer allowed.' },
                { status: 403 }
            );
        }

        // 3. Check if the picked team has been used before in *other* rounds of this game instance
        const previousPicksInOtherRounds = await prisma.lastManStandingPick.findMany({
            where: {
                userGameEntryId: userGameEntry.id,
                roundId: {
                    not: roundId // Exclude the current round from this specific check
                }
            },
            select: {
                pickedTeamId: true
            }
        });

        const usedTeamIdsInOtherRounds = previousPicksInOtherRounds.map((pick) => pick.pickedTeamId);
        if (usedTeamIdsInOtherRounds.includes(String(pickedTeamId))) {
            return NextResponse.json(
                { message: 'You have already picked this team in a previous round of this game cycle.' },
                { status: 403 }
            );
        }

        // 4. Upsert the pick (create or update)
        await prisma.lastManStandingPick.upsert({
            where: {
                userGameEntryId_roundId: {
                    userGameEntryId: userGameEntry.id,
                    roundId: roundId
                }
            },
            update: {
                pickedTeamId: String(pickedTeamId)
            },
            create: {
                userGameEntryId: userGameEntry.id,
                roundId: roundId,
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

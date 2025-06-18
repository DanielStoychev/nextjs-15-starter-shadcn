import { NextResponse } from 'next/server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth/next';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameInstanceId = searchParams.get('gameInstanceId');

    if (!gameInstanceId) {
        return NextResponse.json({ message: 'Missing gameInstanceId parameter' }, { status: 400 });
    }

    try {
        const userGameEntry = await prisma.userGameEntry.findUnique({
            where: {
                userId_gameInstanceId: {
                    userId: session.user.id,
                    gameInstanceId: gameInstanceId
                }
            }
        });

        if (!userGameEntry) {
            // If the user hasn't made any picks yet, they won't have an entry in some scenarios,
            // or they might not be part of this game instance. Return empty array.
            return NextResponse.json({ pickedTeamIds: [] }, { status: 200 });
        }

        const picks = await prisma.lastManStandingPick.findMany({
            where: {
                userGameEntryId: userGameEntry.id
            },
            select: {
                pickedTeamId: true
            }
        });

        const pickedTeamIds = picks.map((pick) => pick.pickedTeamId);

        return NextResponse.json({ pickedTeamIds }, { status: 200 });
    } catch (error) {
        console.error('Error fetching user Last Man Standing picks:', error);

        return NextResponse.json(
            { message: 'Failed to fetch user picks', details: (error as Error).message },
            { status: 500 }
        );
    }
}

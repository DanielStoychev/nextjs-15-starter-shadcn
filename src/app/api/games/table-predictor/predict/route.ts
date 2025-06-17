import { NextResponse } from 'next/server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { gameInstanceId, predictedOrder, predictedTotalGoals } = await request.json();

    if (!gameInstanceId || !predictedOrder || !Array.isArray(predictedOrder) || predictedTotalGoals === undefined) {
        return NextResponse.json({ message: 'Missing or invalid required fields' }, { status: 400 });
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
        if (!userGameEntry) {
            userGameEntry = await prisma.userGameEntry.create({
                data: {
                    userId: session.user.id,
                    gameInstanceId: gameInstanceId,
                    status: 'ACTIVE' // Assuming they are active upon making a prediction
                }
            });
        }

        // 2. Check if the user has already submitted a prediction for this game instance
        const existingPrediction = await prisma.tablePredictorPrediction.findUnique({
            where: {
                userGameEntryId: userGameEntry.id
            }
        });

        if (existingPrediction) {
            return NextResponse.json(
                { message: 'You have already submitted a prediction for this game instance.' },
                { status: 409 }
            );
        }

        // 3. Save the prediction
        await prisma.tablePredictorPrediction.create({
            data: {
                userGameEntryId: userGameEntry.id,
                predictedOrder: predictedOrder,
                predictedTotalGoals: predictedTotalGoals
            }
        });

        return NextResponse.json({ message: 'Table prediction submitted successfully!' }, { status: 200 });
    } catch (error) {
        console.error('Error submitting Table Predictor prediction:', error);

        return NextResponse.json(
            { message: 'Failed to submit prediction', details: (error as Error).message },
            { status: 500 }
        );
    }
}

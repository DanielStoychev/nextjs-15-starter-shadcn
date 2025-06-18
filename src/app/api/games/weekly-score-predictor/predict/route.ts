import { NextResponse } from 'next/server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { gameInstanceId, predictions } = requestBody;

    console.log('Weekly Score Predictor Predict API: Request Body:', requestBody);
    console.log('Weekly Score Predictor Predict API: Session User ID:', session.user.id);

    if (!gameInstanceId || !predictions || !Array.isArray(predictions) || predictions.length === 0) {
        console.error('Weekly Score Predictor Predict API: Missing or invalid required fields.');

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
            console.log('Weekly Score Predictor Predict API: Creating new UserGameEntry.');
            userGameEntry = await prisma.userGameEntry.create({
                data: {
                    userId: session.user.id,
                    gameInstanceId: gameInstanceId,
                    status: 'ACTIVE' // Assuming they are active upon making a prediction
                }
            });
        } else {
            console.log('Weekly Score Predictor Predict API: Found existing UserGameEntry:', userGameEntry.id);
        }

        const createOrUpdatePromises = predictions.map(
            async (prediction: { fixtureId: string; predictedHomeScore: number; predictedAwayScore: number }) => {
                const { fixtureId, predictedHomeScore, predictedAwayScore } = prediction;

                console.log(
                    `Processing prediction for fixture ${fixtureId}: Home ${predictedHomeScore}, Away ${predictedAwayScore}`
                );

                // Allow 0 as a valid score. Check for null/undefined explicitly.
                if (
                    !fixtureId ||
                    predictedHomeScore === null ||
                    predictedHomeScore === undefined ||
                    predictedAwayScore === null ||
                    predictedAwayScore === undefined
                ) {
                    console.error(`Invalid prediction data for fixture ${fixtureId}:`, prediction);
                    throw new Error('Invalid prediction data provided.');
                }

                // Check if the user has already predicted for this fixture in this game instance
                const existingPrediction = await prisma.weeklyScorePrediction.findUnique({
                    where: {
                        userGameEntryId_fixtureId: {
                            userGameEntryId: userGameEntry.id,
                            fixtureId: fixtureId
                        }
                    }
                });

                if (existingPrediction) {
                    console.warn(
                        `Weekly Score Predictor Predict API: User already submitted prediction for fixture ${fixtureId}.`
                    );
                    // Optionally allow updating predictions before a deadline
                    // For now, we'll prevent re-submission for simplicity
                    throw new Error(`You have already submitted a prediction for fixture ${fixtureId}.`);
                }
                console.log(`Weekly Score Predictor Predict API: Creating new prediction for fixture ${fixtureId}.`);

                return prisma.weeklyScorePrediction.create({
                    data: {
                        userGameEntryId: userGameEntry.id,
                        fixtureId: fixtureId,
                        predictedHomeScore: predictedHomeScore,
                        predictedAwayScore: predictedAwayScore
                    }
                });
            }
        );

        await Promise.all(createOrUpdatePromises);

        return NextResponse.json({ message: 'Weekly score predictions submitted successfully!' }, { status: 200 });
    } catch (error) {
        console.error('Error submitting weekly score predictions:', error);

        return NextResponse.json(
            { message: 'Failed to submit predictions', details: (error as Error).message },
            { status: 500 }
        );
    }
}

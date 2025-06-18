import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    // This route should ideally be protected and triggered by an admin or a scheduled job.
    // For now, we'll allow it to be called, but in a production system,
    // implement robust authentication and authorization.

    const requestBody = await request.json();
    const { gameInstanceId, fixtureResults } = requestBody;

    console.log('Weekly Score Predictor Process Results API: Request Body:', requestBody);

    if (!gameInstanceId || !fixtureResults || !Array.isArray(fixtureResults) || fixtureResults.length === 0) {
        console.error('Weekly Score Predictor Process Results API: Missing or invalid required fields.');

        return NextResponse.json({ message: 'Missing or invalid required fields' }, { status: 400 });
    }

    try {
        const updatePromises = fixtureResults.map(
            async (result: { fixtureId: string; homeScore: number; awayScore: number }) => {
                const { fixtureId, homeScore, awayScore } = result;
                console.log(`Processing results for fixture ${fixtureId}: Actual Score ${homeScore}-${awayScore}`);

                // Find all predictions for this fixture within the game instance
                const predictions = await prisma.weeklyScorePrediction.findMany({
                    where: {
                        fixtureId: fixtureId,
                        userGameEntry: {
                            gameInstanceId: gameInstanceId
                        }
                    },
                    include: {
                        userGameEntry: true
                    }
                });

                for (const prediction of predictions) {
                    let pointsAwarded = 0;

                    // Scoring logic:
                    // 5 for correct score
                    // 2 for correct result (win/draw/loss) but incorrect score
                    // 0 for incorrect result

                    const predictedHomeScore = prediction.predictedHomeScore;
                    const predictedAwayScore = prediction.predictedAwayScore;

                    // Check for correct score
                    if (predictedHomeScore === homeScore && predictedAwayScore === awayScore) {
                        pointsAwarded = 5;
                    } else {
                        // Check for correct result
                        const actualResult = Math.sign(homeScore - awayScore); // 1 for home win, -1 for away win, 0 for draw
                        const predictedResult = Math.sign(predictedHomeScore - predictedAwayScore);

                        if (actualResult === predictedResult) {
                            pointsAwarded = 2;
                        }
                    }

                    // Update the prediction with points awarded
                    await prisma.weeklyScorePrediction.update({
                        where: { id: prediction.id },
                        data: { pointsAwarded: pointsAwarded }
                    });

                    // Update user game entry's current score
                    await prisma.userGameEntry.update({
                        where: { id: prediction.userGameEntry.id },
                        data: {
                            currentScore: {
                                increment: pointsAwarded
                            }
                        }
                    });
                }
            }
        );

        await Promise.all(updatePromises);

        console.log('Weekly Score Predictor Process Results API: All results processed successfully.');

        return NextResponse.json({ message: 'Weekly score results processed successfully!' }, { status: 200 });
    } catch (error) {
        console.error('Error processing weekly score results:', error);

        return NextResponse.json(
            { message: 'Failed to process results', details: (error as Error).message },
            { status: 500 }
        );
    }
}

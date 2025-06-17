import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    // This route should ideally be protected and triggered by an admin or a scheduled job.
    // For now, we'll allow it to be called, but in a production system,
    // implement robust authentication and authorization.

    const { gameInstanceId, actualLeagueOrder, actualTotalGoals } = await request.json();

    if (!gameInstanceId || !actualLeagueOrder || !Array.isArray(actualLeagueOrder) || actualTotalGoals === undefined) {
        return NextResponse.json({ message: 'Missing or invalid required fields' }, { status: 400 });
    }

    try {
        // Fetch all predictions for this game instance
        const predictions = await prisma.tablePredictorPrediction.findMany({
            where: {
                userGameEntry: {
                    gameInstanceId: gameInstanceId
                }
            },
            include: {
                userGameEntry: true
            }
        });

        const updatePromises = predictions.map(async (prediction) => {
            let score = 0;

            // Calculate score based on predicted order vs actual order
            // Simple scoring: 10 points for each correctly placed team
            // More complex scoring could involve proximity, etc.
            prediction.predictedOrder.forEach((teamId, index) => {
                if (actualLeagueOrder[index] === teamId) {
                    score += 10;
                }
            });

            // Award points for total goals prediction (e.g., closer prediction gets more points)
            const goalDifference = Math.abs(prediction.predictedTotalGoals - actualTotalGoals);
            if (goalDifference === 0) {
                score += 50; // Exact match
            } else if (goalDifference <= 5) {
                score += 25; // Within 5 goals
            } else if (goalDifference <= 10) {
                score += 10; // Within 10 goals
            }

            // Update the prediction with the calculated score
            await prisma.tablePredictorPrediction.update({
                where: { id: prediction.id },
                data: { score: score }
            });

            // Update user game entry status if needed (e.g., to COMPLETED)
            await prisma.userGameEntry.update({
                where: { id: prediction.userGameEntry.id },
                data: { status: 'COMPLETED', currentScore: score }
            });
        });

        await Promise.all(updatePromises);

        return NextResponse.json({ message: 'Table Predictor results processed successfully!' }, { status: 200 });
    } catch (error) {
        console.error('Error processing Table Predictor results:', error);

        return NextResponse.json(
            { message: 'Failed to process results', details: (error as Error).message },
            { status: 500 }
        );
    }
}

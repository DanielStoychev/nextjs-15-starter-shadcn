import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { gameInstanceId, fixtureId, results, adminNotes } = await request.json();

        if (!gameInstanceId || !fixtureId || !results) {
            return NextResponse.json(
                { error: 'Missing required fields: gameInstanceId, fixtureId, results' },
                { status: 400 }
            );
        }

        // Validate game instance exists and is in correct status
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { id: gameInstanceId },
            include: { game: true }
        });

        if (!gameInstance) {
            return NextResponse.json({ error: 'Game instance not found' }, { status: 404 });
        }

        // Check if fixture exists
        const fixture = await prisma.fixture.findUnique({
            where: { id: fixtureId },
            include: {
                homeTeam: true,
                awayTeam: true
            }
        });

        if (!fixture) {
            return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
        } // Update fixture with results
        const updatedFixture = await prisma.fixture.update({
            where: { id: fixtureId },
            data: {
                homeScore: results.homeScore,
                awayScore: results.awayScore,
                status: 'FINISHED'
            }
        });

        // Process game-specific logic based on game type
        let processedEntries = 0;

        if (gameInstance.game.slug === 'weekly-score-predictor') {
            // Process weekly score predictions
            const predictions = await prisma.weeklyScorePrediction.findMany({
                where: { fixtureId },
                include: { userGameEntry: true }
            });

            for (const prediction of predictions) {
                let points = 0;

                // Exact score = 3 points
                if (
                    prediction.predictedHomeScore === results.homeScore &&
                    prediction.predictedAwayScore === results.awayScore
                ) {
                    points = 3;
                }
                // Correct result (win/draw/loss) = 1 point
                else {
                    const actualResult =
                        results.homeScore > results.awayScore
                            ? 'HOME'
                            : results.homeScore < results.awayScore
                              ? 'AWAY'
                              : 'DRAW';
                    const predictedResult =
                        prediction.predictedHomeScore > prediction.predictedAwayScore
                            ? 'HOME'
                            : prediction.predictedHomeScore < prediction.predictedAwayScore
                              ? 'AWAY'
                              : 'DRAW';

                    if (actualResult === predictedResult) {
                        points = 1;
                    }
                }

                // Update prediction with points
                await prisma.weeklyScorePrediction.update({
                    where: { id: prediction.id },
                    data: { pointsAwarded: points }
                });

                // Update user game entry score
                await prisma.userGameEntry.update({
                    where: { id: prediction.userGameEntryId },
                    data: {
                        currentScore: {
                            increment: points
                        }
                    }
                });

                processedEntries++;
            }
        } // TODO: Create audit log entry when Prisma client is regenerated
        // For now, just log the action
        console.log('Admin action:', {
            adminId: session.user.id,
            action: 'MANUAL_RESULT_PROCESSING',
            entityType: 'FIXTURE',
            entityId: fixtureId,
            details: {
                gameInstanceId,
                fixtureId,
                results,
                adminNotes,
                processedEntries,
                homeTeam: fixture.homeTeam.name,
                awayTeam: fixture.awayTeam.name
            }
        });

        return NextResponse.json({
            success: true,
            fixture: updatedFixture,
            processedEntries,
            message: `Successfully processed ${processedEntries} user entries for fixture ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`
        });
    } catch (error) {
        console.error('Manual result processing error:', error);

        return NextResponse.json({ error: 'Failed to process results manually' }, { status: 500 });
    }
}

/**
 * Result Processing Job
 * Automatically processes game results and updates user scores
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function resultProcessingJob(): Promise<void> {
    console.log('🔄 Starting result processing job...');

    try {
        // Process Race to 33 games
        await processRaceTo33Results();

        // Process Table Predictor games
        await processTablePredictorResults();

        // Process Weekly Score Predictor games
        await processWeeklyScorePredictorResults();

        console.log('✅ Result processing job completed');
    } catch (error) {
        console.error('❌ Result processing job failed:', error);
        throw error;
    }
}

async function processRaceTo33Results(): Promise<void> {
    console.log('Processing Race to 33 results...');

    try {
        // Get all active Race to 33 game instances
        const raceInstances = await prisma.gameInstance.findMany({
            where: {
                status: 'ACTIVE',
                game: {
                    slug: 'race-to-33'
                }
            },
            include: {
                userEntries: {
                    include: {
                        raceTo33Assignment: true
                    }
                }
            }
        });

        for (const instance of raceInstances) {
            // Get recent fixtures for teams assigned to users
            const allTeamIds = instance.userEntries.flatMap((entry) => entry.raceTo33Assignment?.assignedTeamIds || []);

            if (allTeamIds.length === 0) continue;

            // Fetch recent completed fixtures for these teams
            const recentFixtures = await prisma.fixture.findMany({
                where: {
                    OR: [{ homeTeamId: { in: allTeamIds } }, { awayTeamId: { in: allTeamIds } }],
                    status: 'FT', // Full time
                    homeScore: { not: null },
                    awayScore: { not: null },
                    matchDate: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                },
                include: {
                    homeTeam: true,
                    awayTeam: true
                }
            });

            // Update user scores based on goals scored by their teams
            for (const entry of instance.userEntries) {
                if (!entry.raceTo33Assignment) continue;

                let totalGoals = entry.raceTo33Assignment.cumulativeGoals;

                for (const fixture of recentFixtures) {
                    const teamIds = entry.raceTo33Assignment.assignedTeamIds;

                    if (teamIds.includes(fixture.homeTeamId)) {
                        totalGoals += fixture.homeScore || 0;
                    }
                    if (teamIds.includes(fixture.awayTeamId)) {
                        totalGoals += fixture.awayScore || 0;
                    }
                }

                // Update cumulative goals if changed
                if (totalGoals !== entry.raceTo33Assignment.cumulativeGoals) {
                    await prisma.raceTo33Assignment.update({
                        where: { id: entry.raceTo33Assignment.id },
                        data: {
                            cumulativeGoals: totalGoals,
                            updatedAt: new Date()
                        }
                    });

                    // Check if user reached 33 goals
                    if (totalGoals >= 33) {
                        await prisma.userGameEntry.update({
                            where: { id: entry.id },
                            data: {
                                status: 'COMPLETED',
                                currentScore: totalGoals
                            }
                        });
                    }
                }
            }
        }

        console.log('✅ Race to 33 results processed');
    } catch (error) {
        console.error('❌ Error processing Race to 33 results:', error);
    }
}

async function processTablePredictorResults(): Promise<void> {
    console.log('Processing Table Predictor results...');

    try {
        // Get active Table Predictor instances
        const instances = await prisma.gameInstance.findMany({
            where: {
                status: 'ACTIVE',
                game: {
                    slug: 'table-predictor'
                }
            },
            include: {
                userEntries: {
                    include: {
                        tablePredictorPrediction: true
                    }
                }
            }
        });

        for (const instance of instances) {
            // Check if the season has ended to calculate final scores
            // This is a simplified version - would need proper season end detection
            console.log(`Checking Table Predictor instance: ${instance.name}`);
        }

        console.log('✅ Table Predictor results processed');
    } catch (error) {
        console.error('❌ Error processing Table Predictor results:', error);
    }
}

async function processWeeklyScorePredictorResults(): Promise<void> {
    console.log('Processing Weekly Score Predictor results...');

    try {
        // Get completed fixtures from the last 24 hours
        const completedFixtures = await prisma.fixture.findMany({
            where: {
                status: 'FT',
                homeScore: { not: null },
                awayScore: { not: null },
                matchDate: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });

        for (const fixture of completedFixtures) {
            // Find all predictions for this fixture
            const predictions = await prisma.weeklyScorePrediction.findMany({
                where: {
                    fixtureId: fixture.id,
                    pointsAwarded: null // Not yet processed
                }
            });

            for (const prediction of predictions) {
                let points = 0;

                // Exact score prediction (5 points)
                if (
                    prediction.predictedHomeScore === fixture.homeScore &&
                    prediction.predictedAwayScore === fixture.awayScore
                ) {
                    points = 5;
                }
                // Correct result (3 points)
                else if (
                    (prediction.predictedHomeScore > prediction.predictedAwayScore &&
                        fixture.homeScore! > fixture.awayScore!) ||
                    (prediction.predictedHomeScore < prediction.predictedAwayScore &&
                        fixture.homeScore! < fixture.awayScore!) ||
                    (prediction.predictedHomeScore === prediction.predictedAwayScore &&
                        fixture.homeScore === fixture.awayScore)
                ) {
                    points = 3;
                }

                // Update prediction with points
                await prisma.weeklyScorePrediction.update({
                    where: { id: prediction.id },
                    data: { pointsAwarded: points }
                });

                // Update user's total score
                const userEntry = await prisma.userGameEntry.findUnique({
                    where: { id: prediction.userGameEntryId }
                });

                if (userEntry) {
                    await prisma.userGameEntry.update({
                        where: { id: userEntry.id },
                        data: {
                            currentScore: userEntry.currentScore + points
                        }
                    });
                }
            }
        }

        console.log('✅ Weekly Score Predictor results processed');
    } catch (error) {
        console.error('❌ Error processing Weekly Score Predictor results:', error);
    }
}

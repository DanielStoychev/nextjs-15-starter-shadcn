import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import {
    getSeasonStandings,
    getSeasonStatistics
    // Functions for fallback if total goals not in season stats:
    // getSeasonDetails, // To get round IDs
    // getSeasonRounds, // Alternative to get round IDs
    // getRoundFixtures, // To get fixture IDs per round
    // getFixturesDetailsByIds, // To get scores for fixtures
} from '@/lib/sportmonks-api';

// TODO: Define these interfaces more accurately based on actual SportMonks V3 API responses.
// These are conceptual and may need adjustment.
interface SportMonksTeamData {
    id: number; // SportMonks Team ID (numeric)
    name?: string;
    // ... other properties if needed
}

interface SportMonksStandingEntry {
    team_id?: number;
    participant_id?: number; // Common alternative for team identifier
    position: number;
    team?: SportMonksTeamData; // If team data is nested under a 'team' object
    // other details like points, form, etc. might be here or in a 'details' array
}

interface SportMonksSeasonStatistic {
    type_id: number;
    name?: string; // Often a human-readable name for the statistic type
    value: number | { count?: number; total?: number; [key: string]: any }; // Value can be complex
    details?: any[]; // Sometimes stats have further details
    // ... other properties
}

interface ProcessResultsRequestBody {
    gameInstanceId: string;
    sportMonksSeasonId: number;
}

// Helper function to robustly extract team ID from various possible structures in SportMonks standing objects
const getTeamIdFromStanding = (standing: SportMonksStandingEntry): string | null => {
    const id = standing.team_id ?? standing.participant_id ?? standing.team?.id;

    return id ? String(id) : null;
};

export async function POST(request: Request) {
    // TODO: Implement robust authentication and authorization (e.g., check for ADMIN role from session)
    // Example:
    // const session = await getServerSession(authOptions);
    // if (!session || session.user?.role !== Role.ADMIN) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    let requestBody: ProcessResultsRequestBody;
    try {
        requestBody = await request.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { gameInstanceId, sportMonksSeasonId } = requestBody;

    if (!gameInstanceId || sportMonksSeasonId === undefined || typeof sportMonksSeasonId !== 'number') {
        return NextResponse.json(
            { message: 'Missing or invalid gameInstanceId or sportMonksSeasonId' },
            { status: 400 }
        );
    }

    try {
        // 1. Fetch Actual League Order from SportMonks
        const standingsResponse = await getSeasonStandings(sportMonksSeasonId, 'team;details');

        if (!standingsResponse || !standingsResponse.data || !Array.isArray(standingsResponse.data)) {
            console.error(
                `Failed to fetch or parse season standings from SportMonks for season ${sportMonksSeasonId}. Response:`,
                standingsResponse
            );

            return NextResponse.json(
                { message: 'Failed to fetch or parse season standings from SportMonks.' },
                { status: 500 }
            );
        }

        const actualLeagueOrderData = (standingsResponse.data as SportMonksStandingEntry[])
            .sort((a, b) => a.position - b.position) // Sort by position
            .map((standing) => getTeamIdFromStanding(standing)) // Extract team ID as string
            .filter((id) => id !== null) as string[]; // Filter out any null IDs

        // Ensure we have the expected number of teams (e.g., 20 for Premier League)
        if (actualLeagueOrderData.length === 0) {
            // Consider checking for a specific number like 20
            console.error(
                `Processed league order from SportMonks for season ${sportMonksSeasonId} is empty or invalid. Original data:`,
                standingsResponse.data
            );

            return NextResponse.json(
                { message: 'Processed league order from SportMonks is empty or invalid.' },
                { status: 500 }
            );
        }

        // 2. Fetch Actual Total Goals from SportMonks
        let actualTotalGoals: number | null = null;
        // TODO: Identify the correct type_id or reliable property for 'total goals scored' in a season from SportMonks documentation or sample response.
        const KNOWN_TOTAL_GOALS_STAT_TYPE_ID = 0; // Replace 0 with the actual type_id if known
        const KNOWN_TOTAL_GOALS_STAT_NAME_PATTERN = /total.*goals|goals.*scored/i; // Regex to match common names

        try {
            const statsResponse = await getSeasonStatistics(sportMonksSeasonId, 'details;type'); // Include type for stat name
            if (statsResponse && statsResponse.data && Array.isArray(statsResponse.data)) {
                const goalStat = (statsResponse.data as SportMonksSeasonStatistic[]).find((stat) => {
                    // Try matching by a known type_id if available
                    if (KNOWN_TOTAL_GOALS_STAT_TYPE_ID !== 0 && stat.type_id === KNOWN_TOTAL_GOALS_STAT_TYPE_ID) {
                        return true;
                    }
                    // Try matching by name pattern
                    const statName = (stat as any).name || (stat as any).type?.name; // Accessing potential name fields
                    if (
                        statName &&
                        typeof statName === 'string' &&
                        KNOWN_TOTAL_GOALS_STAT_NAME_PATTERN.test(statName)
                    ) {
                        return true;
                    }

                    return false;
                });

                if (goalStat) {
                    if (typeof goalStat.value === 'number') {
                        actualTotalGoals = goalStat.value;
                    } else if (
                        goalStat.value &&
                        (typeof goalStat.value.count === 'number' || typeof goalStat.value.total === 'number')
                    ) {
                        actualTotalGoals = goalStat.value.total ?? goalStat.value.count ?? null;
                    }
                }
            }
        } catch (statsError) {
            console.warn(
                `Could not fetch season statistics directly for season ${sportMonksSeasonId}. Error:`,
                statsError
            );
        }

        if (actualTotalGoals === null) {
            console.warn(
                `Total goals for season ${sportMonksSeasonId} could not be determined from getSeasonStatistics. Fallback to summing fixture goals is not yet implemented.`
            );
            // TODO: Implement fallback: Sum goals from all season fixtures.
            // This would involve:
            // 1. Fetch all round IDs for the season.
            // 2. For each round, fetch all fixture IDs.
            // 3. For all fixture IDs, fetch their scores.
            // 4. Sum home_score + away_score for all completed fixtures.
            // For now, if not found, tie-breaking by goals might not be possible or accurate.
            // Consider returning an error or specific message if this data is critical and missing.
        }

        // 3. Fetch all user predictions for this game instance
        const predictions = await prisma.tablePredictorPrediction.findMany({
            where: {
                userGameEntry: {
                    gameInstanceId: gameInstanceId
                    // Process all entries, status will be updated to COMPLETED.
                    // Consider if only 'ACTIVE' entries should be processed.
                }
            },
            include: {
                userGameEntry: true
            }
        });

        const updatePromises = predictions.map(async (prediction) => {
            let newScore = 0;

            prediction.predictedOrder.forEach((predictedTeamId, predictedPositionIndex) => {
                const actualPositionIndex = actualLeagueOrderData.indexOf(predictedTeamId);

                if (actualPositionIndex !== -1) {
                    // Team was found in the actual league order
                    const diff = Math.abs(predictedPositionIndex - actualPositionIndex);
                    if (diff === 0) {
                        newScore += 25; // Exact position
                    } else if (diff === 1) {
                        newScore += 15; // +/- 1
                    } else if (diff === 2) {
                        newScore += 10; // +/- 2
                    } else if (diff === 3) {
                        newScore += 5; // +/- 3
                    }
                }
            });

            await prisma.tablePredictorPrediction.update({
                where: { id: prediction.id },
                data: { score: newScore }
            });

            await prisma.userGameEntry.update({
                where: { id: prediction.userGameEntry.id },
                data: { status: 'COMPLETED', currentScore: newScore }
            });
        });

        await Promise.all(updatePromises);

        // After all scores are updated, mark the GameInstance as COMPLETED
        await prisma.gameInstance.update({
            where: { id: gameInstanceId },
            data: { status: 'COMPLETED' }
        });

        // Tie-breaking (using actualTotalGoals and prediction.predictedTotalGoals)
        // is handled when determining the final winner from the leaderboard, not by modifying the stored 'score'.
        // The 'actualTotalGoals' fetched here would be passed to that separate winner determination logic.

        return NextResponse.json(
            {
                message: 'Table Predictor results processed successfully!',
                details: {
                    standingsFetched: actualLeagueOrderData.length > 0,
                    totalGoalsValue: actualTotalGoals,
                    predictionsProcessed: predictions.length
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error processing Table Predictor results:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

        return NextResponse.json({ message: 'Failed to process results', details: errorMessage }, { status: 500 });
    }
}

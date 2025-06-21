import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import { notifyElimination } from '@/lib/notification-service';
import prisma from '@/lib/prisma';
import { getFixturesDetailsByIds, getRoundFixtures } from '@/lib/sportmonks-api';

import { getServerSession } from 'next-auth/next';

// Define interfaces for SportMonks data structures
interface SportMonksParticipant {
    id: number; // SportMonks Team ID
    name: string;
    image_path: string;
    meta?: { location: 'home' | 'away' };
}

interface SportMonksScore {
    score: {
        home: number;
        away: number;
    };
    description: string; // e.g., "FT", "HT"
    type_id: number; // SportMonks state ID
}

interface SportMonksFixture {
    id: number; // SportMonks Fixture ID
    name: string;
    starting_at: string;
    round_id?: number;
    league_id?: number;
    season_id?: number;
    state?: { state: string }; // To get FT, NS, etc. from state object
    participants: SportMonksParticipant[];
    scores: SportMonksScore[];
}

// Helper function to determine the winner of a fixture
function getFixtureWinner(fixture: SportMonksFixture): number | null | 'draw' {
    if (fixture.state?.state !== 'FT' && fixture.state?.state !== 'AET' && fixture.state?.state !== 'FT_PEN') {
        return null; // Match not finished
    }

    const finalScore = fixture.scores.find((s) => s.description === 'CURRENT' || s.description === 'FT');
    if (!finalScore) return null; // No final score found

    const homeScore = finalScore.score.home;
    const awayScore = finalScore.score.away;

    const homeTeam = fixture.participants.find((p) => p.meta?.location === 'home');
    const awayTeam = fixture.participants.find((p) => p.meta?.location === 'away');

    if (homeScore > awayScore) {
        return homeTeam?.id || null;
    } else if (awayScore > homeScore) {
        return awayTeam?.id || null;
    } else {
        return 'draw';
    }
}

export async function POST(request: Request) {
    const apiKey = request.headers.get('X-API-KEY');
    const session = await getServerSession(authOptions);
    let authorized = false;

    if (process.env.CRON_SECRET && apiKey === process.env.CRON_SECRET) {
        authorized = true;
    } else if (process.env.NODE_ENV !== 'production' && session?.user?.role === 'ADMIN') {
        // Allow admin access in non-production if CRON_SECRET is not used/matched
        authorized = true;
    }

    if (!authorized) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { roundId, gameInstanceId } = await request.json(); // roundId is the local DB CUID

    if (!roundId || !gameInstanceId) {
        return NextResponse.json({ message: 'Missing roundId or gameInstanceId' }, { status: 400 });
    }

    try {
        const localRound = await prisma.round.findUnique({
            where: { id: roundId },
            select: { sportMonksId: true, name: true }
        });

        if (!localRound || !localRound.sportMonksId) {
            return NextResponse.json({ message: 'Local round not found or missing SportMonks ID.' }, { status: 404 });
        }

        const sportMonksRoundId = localRound.sportMonksId;

        // 1. Fetch actual fixture results from SportMonks for the given SportMonks round ID
        const roundFixturesResponse = await getRoundFixtures(sportMonksRoundId);
        const initialFixturesData: SportMonksFixture[] =
            roundFixturesResponse.data?.fixtures?.data || roundFixturesResponse.data?.fixtures || [];

        let liveFixtures: SportMonksFixture[] = [];
        if (initialFixturesData.length > 0) {
            const fixtureIds = initialFixturesData.map((f) => f.id).join(',');
            // Fetch details including participants, scores, and state
            const fixturesDetailsResponse = await getFixturesDetailsByIds(fixtureIds, 'participants,scores,state');
            liveFixtures = fixturesDetailsResponse.data || [];
        }

        if (liveFixtures.length === 0) {
            return NextResponse.json(
                { message: `No live fixtures found on SportMonks for round ${sportMonksRoundId}.` },
                { status: 404 }
            );
        }

        // Create a map of fixture results for quick lookup
        const fixtureResultsMap = new Map<number, number | null | 'draw'>(); // SportMonksFixtureID -> WinningTeamID | 'draw' | null
        for (const fixture of liveFixtures) {
            if (fixture.state?.state === 'FT' || fixture.state?.state === 'AET' || fixture.state?.state === 'FT_PEN') {
                // Ensure match is finished
                const winnerId = getFixtureWinner(fixture);
                fixtureResultsMap.set(fixture.id, winnerId);
            }
        }

        // --- START: "No Pick" Auto-Assignment Logic ---
        // Fetch all active user game entries for this instance
        const activeUserEntries = await prisma.userGameEntry.findMany({
            where: {
                gameInstanceId: gameInstanceId,
                status: 'ACTIVE'
            },
            select: {
                id: true, // UserGameEntry ID
                lastManStandingPicks: {
                    where: { roundId: roundId },
                    select: { id: true }
                }
            }
        });

        const usersWithoutPick = activeUserEntries.filter((entry) => entry.lastManStandingPicks.length === 0);

        if (usersWithoutPick.length > 0) {
            // Determine the most picked team for this round among those who did pick
            const allPicksForRound = await prisma.lastManStandingPick.findMany({
                where: { roundId: roundId, userGameEntry: { gameInstanceId: gameInstanceId } }, // Consider all picks in the round for this game
                select: { pickedTeamId: true }
            });

            if (allPicksForRound.length > 0) {
                const pickCounts = allPicksForRound.reduce(
                    (acc, pick) => {
                        acc[pick.pickedTeamId] = (acc[pick.pickedTeamId] || 0) + 1;

                        return acc;
                    },
                    {} as Record<string, number>
                );

                let mostPickedTeamId: string | null = null;
                let maxCount = 0;
                for (const teamId in pickCounts) {
                    if (pickCounts[teamId] > maxCount) {
                        maxCount = pickCounts[teamId];
                        mostPickedTeamId = teamId;
                    }
                }

                if (mostPickedTeamId) {
                    for (const userEntry of usersWithoutPick) {
                        // Check if this auto-assigned pick would violate the "no re-pick" rule for this user
                        const previousUserPicks = await prisma.lastManStandingPick.findMany({
                            where: { userGameEntryId: userEntry.id },
                            select: { pickedTeamId: true }
                        });
                        const usedTeamIds = previousUserPicks.map((p) => p.pickedTeamId);

                        if (!usedTeamIds.includes(mostPickedTeamId)) {
                            await prisma.lastManStandingPick.create({
                                data: {
                                    userGameEntryId: userEntry.id,
                                    roundId: roundId,
                                    pickedTeamId: mostPickedTeamId
                                    // isCorrect will be determined later
                                    // Add a flag or note indicating this was an auto-pick if needed for auditing
                                }
                            });
                            console.log(
                                `Auto-assigned pick ${mostPickedTeamId} to UserGameEntry ${userEntry.id} for round ${localRound.name}`
                            );
                        } else {
                            // If most picked team is already used by this user, they effectively get no pick / an instant loss for this round.
                            // This needs careful consideration: what's the penalty? Or assign 2nd most picked?
                            // For now, they get no pick, which means their pick will be evaluated as incorrect by default later.
                            // Or, more directly, eliminate them if no valid auto-pick can be made.
                            // Let's assume for now, if auto-assign fails due to re-pick, they are eliminated.
                            await prisma.userGameEntry.update({
                                where: { id: userEntry.id },
                                data: { status: 'ELIMINATED' }
                            });
                            console.log(
                                `UserGameEntry ${userEntry.id} could not be auto-assigned team ${mostPickedTeamId} due to re-pick rule, eliminating.`
                            );
                        }
                    }
                } else {
                    // No picks made by anyone, so no "most picked team". Users without a pick are effectively out for this round.
                    // Or, handle by eliminating them if no pick means elimination.
                    for (const userEntry of usersWithoutPick) {
                        await prisma.userGameEntry.update({
                            where: { id: userEntry.id },
                            data: { status: 'ELIMINATED' }
                        });
                        console.log(
                            `UserGameEntry ${userEntry.id} had no pick and no team could be auto-assigned (no picks in round). Eliminating.`
                        );
                    }
                }
            } else {
                // No picks in the round at all. All users who didn't pick are eliminated.
                for (const userEntry of usersWithoutPick) {
                    await prisma.userGameEntry.update({
                        where: { id: userEntry.id },
                        data: { status: 'ELIMINATED' }
                    });
                    console.log(
                        `UserGameEntry ${userEntry.id} had no pick and no other picks in round to determine auto-assign. Eliminating.`
                    );
                }
            }
        }
        // --- END: "No Pick" Auto-Assignment Logic ---

        // 2. Fetch all LastManStandingPick entries for the current local roundId and gameInstanceId (RE-FETCH to include auto-assigned ones)
        const picks = await prisma.lastManStandingPick.findMany({
            where: {
                roundId: roundId, // local DB CUID
                userGameEntry: {
                    gameInstanceId: gameInstanceId,
                    status: 'ACTIVE' // Only process picks from active users
                }
            },
            include: {
                userGameEntry: true // Include user game entry to update status
            }
        });

        if (picks.length === 0) {
            return NextResponse.json(
                { message: 'No active picks found for this round in this game instance.' },
                { status: 200 }
            );
        }

        let usersEliminatedThisRound = 0;

        for (const pick of picks) {
            const pickedTeamSmId = parseInt(pick.pickedTeamId, 10); // Ensure it's a number for lookup
            let isCorrect = false;
            let pickProcessed = false;

            // Find the fixture the picked team played in
            const relevantFixture = liveFixtures.find((f) => f.participants.some((p) => p.id === pickedTeamSmId));

            if (relevantFixture && fixtureResultsMap.has(relevantFixture.id)) {
                const winner = fixtureResultsMap.get(relevantFixture.id);
                if (winner === pickedTeamSmId) {
                    // Check if the winner is the picked team
                    isCorrect = true;
                }
                // If winner is 'draw' or another team, or null (match not finished properly), pick is incorrect for LMS
                pickProcessed = true;
            } else {
                // Fixture not found for picked team or not finished, treat as incorrect for LMS
                // Or log this as an issue, e.g. team picked didn't play in this round?
                console.warn(
                    `Fixture for picked team ${pickedTeamSmId} (Pick ID: ${pick.id}) not found or not finished in round ${sportMonksRoundId}. Marking as incorrect.`
                );
                isCorrect = false;
                pickProcessed = true; // Still process the pick as incorrect
            }

            if (pickProcessed) {
                await prisma.lastManStandingPick.update({
                    where: { id: pick.id },
                    data: {
                        isCorrect: isCorrect
                        // isEliminated could be set here too, but UserGameEntry.status is the main driver
                    }
                });

                if (!isCorrect) {
                    await prisma.userGameEntry.update({
                        where: { id: pick.userGameEntry.id },
                        data: { status: 'ELIMINATED' }
                    });
                    usersEliminatedThisRound++;

                    // Trigger elimination notification
                    try {
                        await notifyElimination(pick.userGameEntry.userId, gameInstanceId, localRound.name);
                    } catch (notificationError) {
                        console.error('Failed to send elimination notification:', notificationError);
                        // Don't fail the main process if notification fails
                    }
                }
            }
        }

        // 3. Check for rollovers (all active players for this gameInstanceId eliminated)
        // This check should be against the specific gameInstanceId
        const remainingActiveUsers = await prisma.userGameEntry.count({
            where: {
                gameInstanceId: gameInstanceId,
                status: 'ACTIVE'
            }
        });

        let rolloverTriggered = false;
        if (remainingActiveUsers === 0 && picks.length > 0) {
            // Ensure there were picks to process
            rolloverTriggered = true;
            console.log(
                `All players for game instance ${gameInstanceId} eliminated! Rollover triggered for round ${localRound.name}.`
            );
            // TODO: Implement actual rollover logic:
            // For now, a rollover means the game instance is COMPLETED.
            // Prize pool handling and new instance creation are future enhancements.
            // The 'isRollover' flag below will indicate if this completion was due to a rollover.
        }

        // Determine final status of the game instance
        const finalRemainingActiveUsers = await prisma.userGameEntry.count({
            where: { gameInstanceId: gameInstanceId, status: 'ACTIVE' }
        });

        const currentInstance = await prisma.gameInstance.findUnique({
            where: { id: gameInstanceId }
            // Fetches all scalar fields including numberOfRounds, instanceRoundCUIDs
        });

        if (!currentInstance) {
            // This should ideally not happen if earlier checks passed
            console.error(`Critical error: GameInstance ${gameInstanceId} not found for final status update.`);
            // Consider how to handle this - maybe return an error response earlier
        }

        let finalInstanceStatus: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' = currentInstance?.status || 'ACTIVE'; // Default to existing or ACTIVE
        let isRolloverScenario = false;

        if (currentInstance) {
            // Using 'as any' for numberOfRounds and instanceRoundCUIDs due to persistent TS type errors
            // This assumes the fields are present at runtime after a successful prisma generate & migration.
            const numberOfRounds = (currentInstance as any).numberOfRounds as number | null | undefined;
            const instanceRoundCUIDs = (currentInstance as any).instanceRoundCUIDs as string[] | undefined;

            const isCustomDurationGame = numberOfRounds && instanceRoundCUIDs && instanceRoundCUIDs.length > 0;
            const isLastRoundOfInstance =
                isCustomDurationGame && instanceRoundCUIDs![instanceRoundCUIDs!.length - 1] === roundId;

            if (isLastRoundOfInstance) {
                finalInstanceStatus = 'COMPLETED';
                if (finalRemainingActiveUsers === 0) {
                    console.log(
                        `LMS Game instance ${gameInstanceId} (custom duration) ended on its last round with all players eliminated. Considered a rollover.`
                    );
                    isRolloverScenario = true;
                } else {
                    console.log(
                        `LMS Game instance ${gameInstanceId} (custom duration) completed. ${finalRemainingActiveUsers} winner(s).`
                    );
                }
            } else if (finalRemainingActiveUsers === 0 && picks.length > 0) {
                // Not necessarily the last round (or not a custom game), but everyone eliminated
                finalInstanceStatus = 'COMPLETED';
                isRolloverScenario = true;
                console.log(
                    `LMS: All players for game instance ${gameInstanceId} eliminated before designated final round (if any)! Rollover triggered for round ${localRound.name}.`
                );
            }
            // If none of the above, status remains as is (e.g. ACTIVE if game continues)

            if (finalInstanceStatus !== currentInstance.status) {
                await prisma.gameInstance.update({
                    where: { id: gameInstanceId },
                    data: { status: finalInstanceStatus }
                });
                console.log(
                    `LMS Game instance ${gameInstanceId} status updated to ${finalInstanceStatus}. Rollover: ${isRolloverScenario}`
                );
            }
        }

        return NextResponse.json(
            {
                message: 'Last Man Standing results processed successfully.',
                details: {
                    roundProcessed: localRound.name,
                    picksEvaluated: picks.length,
                    usersEliminatedThisRound: usersEliminatedThisRound,
                    remainingActiveUsers: finalRemainingActiveUsers, // Use the re-fetched count
                    rolloverTriggered: isRolloverScenario
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error processing Last Man Standing results:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return NextResponse.json(
            { message: 'Failed to process Last Man Standing results', details: errorMessage },
            { status: 500 }
        );
    }
}

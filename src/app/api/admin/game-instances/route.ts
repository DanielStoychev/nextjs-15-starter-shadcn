import { NextResponse } from 'next/server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// import { PREMIER_LEAGUE_ID } from '@/lib/constants'; // File does not exist
import prisma from '@/lib/prisma';
import { getLeagueDetails, getSeasonRounds } from '@/lib/sportmonks-api';

import { getServerSession } from 'next-auth/next';

const PREMIER_LEAGUE_ID = 8; // Define locally for now

// Helper function to find or create local league, season, and round records
async function ensureLocalRoundExists(
    sportMonksRound: any,
    sportMonksSeasonId: number,
    sportMonksLeagueId: number,
    localLeagueId: string,
    localSeasonId: string
) {
    let dbRound = await prisma.round.findUnique({ where: { sportMonksId: sportMonksRound.id } });
    if (!dbRound) {
        const sDate = new Date(sportMonksRound.starting_at);
        const eDate = new Date(sportMonksRound.ending_at);
        if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
            dbRound = await prisma.round.create({
                data: {
                    sportMonksId: sportMonksRound.id,
                    name: sportMonksRound.name,
                    startDate: sDate,
                    endDate: eDate,
                    seasonId: localSeasonId,
                    leagueId: localLeagueId
                }
            });
        } else {
            throw new Error(`Invalid start/end date for SportMonks round ${sportMonksRound.id}`);
        }
    }

    return dbRound;
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const {
            gameId, // CUID of the Game model
            name,
            startDate, // ISO string
            entryFee,
            prizePool,
            numberOfRounds, // Optional: number of rounds for duration-limited games
            endDate, // Optional: required if numberOfRounds is not set for some game types
            status // Optional: GameStatus enum
        } = body;

        if (!gameId || !name || !startDate) {
            return NextResponse.json({ message: 'Missing required fields: gameId, name, startDate' }, { status: 400 });
        }

        let calculatedEndDate = endDate ? new Date(endDate) : null;
        const instanceRoundCUIDs: string[] = [];

        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game) {
            return NextResponse.json({ message: 'Game not found' }, { status: 404 });
        }

        if (numberOfRounds && numberOfRounds > 0) {
            if (game.slug !== 'last-man-standing' && game.slug !== 'weekly-score-predictor') {
                return NextResponse.json(
                    {
                        message:
                            'numberOfRounds is only applicable for specific game types like Last Man Standing or Weekly Score Predictor.'
                    },
                    { status: 400 }
                );
            }
            // Logic to determine rounds for LMS (Premier League)
            // This assumes LMS uses Premier League. Adapt if other leagues are possible.
            const leagueSmId = PREMIER_LEAGUE_ID;

            const leagueDetailsResponse = await getLeagueDetails(leagueSmId, 'currentSeason');
            const apiLeagueData = leagueDetailsResponse.data;
            if (!apiLeagueData || !apiLeagueData.currentseason) {
                throw new Error(`Could not fetch current season for league ${leagueSmId}`);
            }
            const currentSeasonSmId = apiLeagueData.currentseason.id;

            let dbLeague = await prisma.league.findUnique({ where: { sportMonksId: leagueSmId } });
            if (!dbLeague) {
                dbLeague = await prisma.league.create({
                    data: { sportMonksId: leagueSmId, name: apiLeagueData.name, countryId: apiLeagueData.country_id! }
                });
            }
            let dbSeason = await prisma.season.findUnique({ where: { sportMonksId: currentSeasonSmId } });
            if (!dbSeason) {
                dbSeason = await prisma.season.create({
                    data: {
                        sportMonksId: currentSeasonSmId,
                        name: apiLeagueData.currentseason.name,
                        isCurrent: true,
                        leagueId: dbLeague.id
                    }
                });
            }

            const roundsResponse = await getSeasonRounds(currentSeasonSmId);
            const allSportMonksRounds: any[] = roundsResponse.data || [];
            allSportMonksRounds.sort((a, b) => new Date(a.starting_at).getTime() - new Date(b.starting_at).getTime());

            const relevantSportMonksRounds = allSportMonksRounds
                .filter((r) => new Date(r.starting_at) >= new Date(startDate))
                .slice(0, numberOfRounds);

            if (relevantSportMonksRounds.length < numberOfRounds) {
                return NextResponse.json(
                    { message: `Could not find ${numberOfRounds} upcoming rounds for the selected start date.` },
                    { status: 400 }
                );
            }

            for (const smRound of relevantSportMonksRounds) {
                const localRound = await ensureLocalRoundExists(
                    smRound,
                    currentSeasonSmId,
                    leagueSmId,
                    dbLeague.id,
                    dbSeason.id
                );
                instanceRoundCUIDs.push(localRound.id);
            }

            calculatedEndDate = new Date(relevantSportMonksRounds[relevantSportMonksRounds.length - 1].ending_at);
        } else if (!endDate) {
            // If not using numberOfRounds, an explicit endDate might be required depending on game type or admin preference
            // For simplicity now, if no numberOfRounds, we require endDate.
            return NextResponse.json(
                { message: 'endDate is required if numberOfRounds is not specified.' },
                { status: 400 }
            );
        }

        const newGameInstance = await prisma.gameInstance.create({
            data: {
                gameId,
                name,
                startDate: new Date(startDate),
                endDate: calculatedEndDate!, // Assert not null as one path must set it
                entryFee: entryFee || 0,
                prizePool: prizePool || 0,
                status: status || 'PENDING',
                numberOfRounds: numberOfRounds || null,
                instanceRoundCUIDs: instanceRoundCUIDs
            } as any // Cast to any to bypass TS error if types are not updated
        });

        return NextResponse.json(newGameInstance, { status: 201 });
    } catch (error) {
        console.error('Error creating game instance:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return NextResponse.json({ message: 'Failed to create game instance', details: errorMessage }, { status: 500 });
    }
}

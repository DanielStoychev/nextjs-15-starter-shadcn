import { notFound } from 'next/navigation';

import { GameRulesButton } from '@/components/game-rules-button';
import { LastManStandingGame } from '@/components/last-man-standing-game';
import { LastManStandingLeaderboard } from '@/components/last-man-standing-leaderboard';
import { RaceTo33Game } from '@/components/race-to-33-game';
import { RaceTo33Leaderboard } from '@/components/race-to-33-leaderboard';
import TablePredictorGame from '@/components/table-predictor-game';
import TablePredictorLeaderboard from '@/components/table-predictor-leaderboard';
import WeeklyScorePredictorGame from '@/components/weekly-score-predictor-game';
import WeeklyScorePredictorLeaderboard from '@/components/weekly-score-predictor-leaderboard';
// Corrected import
import prisma from '@/lib/prisma';
import {
    getFixturesDetailsByIds,
    getLeagueDetails,
    getRoundFixtures,
    getSeasonDetails,
    getSeasonRounds,
    getSeasonStandings,
    getSeasonTeams,
    searchTeamByName // Added searchTeamByName
} from '@/lib/sportmonks-api';
// Import SportMonks functions
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
// Assuming GameInstance is the base model type, and Prisma namespace is available
import { Game, League, Prisma, GameInstance as PrismaGameInstanceType, Season } from '@prisma/client';

const PREMIER_LEAGUE_ID = 8;
const CHAMPIONSHIP_ID = 9;
const LEAGUE_ONE_ID = 12;
const LEAGUE_TWO_ID = 14;

interface GamePageProps {
    params: {
        gameSlug: string;
        instanceId: string;
    };
}

interface WspDisplayFixture {
    id: string; // This will be the CUID of the local Fixture record
    homeTeam: { id: string; name: string; logoPath: string };
    awayTeam: { id: string; name: string; logoPath: string };
    matchDate: string;
}

interface SportMonksLeague {
    id: number;
    name: string;
    country_id?: number;
    current_season_id?: number;
    currentseason?: {
        id: number;
        name: string;
        finished: boolean;
        is_current?: boolean;
        pending?: boolean;
    };
}

interface SportMonksRound {
    id: number;
    name: string;
    starting_at: string;
    ending_at: string;
    league_id?: number; // Added to help link back to league
    season_id?: number; // Added to help link back to season
}

interface SportMonksParticipant {
    id: number;
    name: string;
    image_path: string;
    meta: { location: 'home' | 'away' };
    country_id?: number; // For creating Team if it doesn't exist
}

interface SportMonksFixture {
    id: number;
    name: string;
    starting_at: string;
    round_id?: number; // SportMonks round_id
    league_id?: number; // SportMonks league_id
    season_id?: number; // SportMonks season_id
    participants: SportMonksParticipant[];
    scores: Array<{
        score: { home: number; away: number };
        description: string;
        type: 'FT' | 'HT' | 'ET' | 'PEN'; // Strict types as expected by LastManStandingGame
    }>;
}

// Helper function to find or create a team
async function findOrCreateTeam(participant: SportMonksParticipant, leagueIdCuid: string, seasonIdCuid: string) {
    let team = await prisma.team.findUnique({ where: { sportMonksId: participant.id } });
    if (!team) {
        team = await prisma.team.create({
            data: {
                sportMonksId: participant.id,
                name: participant.name,
                logoPath: participant.image_path,
                leagueId: leagueIdCuid, // CUID of the local league
                seasonId: seasonIdCuid // CUID of the local season
            }
        });
    }

    return team;
}

// Define the type for gameInstance with the included game relation
// type GameInstanceWithGame = Prisma.GameInstanceGetPayload<{
//     include: { game: true };
// }> & {
//     // Ensure our new fields are recognized by TypeScript
//     numberOfRounds?: number | null;
//     instanceRoundCUIDs?: string[];
// };
// Using a more direct approach if GetPayload struggles with TS server updates
// interface GameInstanceWithGame extends PrismaGameInstanceType {
//     game: Game; // Game is included
//     numberOfRounds?: number | null; // Explicitly add optional new fields
//     instanceRoundCUIDs?: string[]; // Explicitly add optional new fields
// }

export default async function GamePage({ params }: GamePageProps) {
    const { gameSlug, instanceId } = await params;

    const gameInstanceData = await prisma.gameInstance.findUnique({
        where: { id: instanceId },
        include: { game: true }
    });

    if (!gameInstanceData) notFound();
    // Further check for game slug after confirming gameInstanceData and gameInstanceData.game exist
    if (!gameInstanceData.game || gameInstanceData.game.slug !== gameSlug) notFound();

    // gameInstanceData is of type Prisma.GameInstanceGetPayload<{ include: { game: true } }>
    // This payload type should include all scalar fields of GameInstance plus the 'game' relation.
    const gameInstance: Prisma.GameInstanceGetPayload<{ include: { game: true } }> = gameInstanceData;

    const game = gameInstance.game;
    // Reverting to 'as any' due to persistent TS errors, assuming fields exist at runtime.
    // This suggests an ongoing issue with TS server/Prisma client type resolution.
    const customNumberOfRounds = (gameInstance as any).numberOfRounds as number | null | undefined;
    const instanceRoundCUIDs = (gameInstance as any).instanceRoundCUIDs as string[] | undefined;

    let liveFixtures: SportMonksFixture[] = [];
    let liveLmsCurrentRoundDbId: string | null = null;
    let isSeasonFinished: boolean = false;

    if (game.slug === 'last-man-standing') {
        try {
            const leagueDetailsResponse = await getLeagueDetails(PREMIER_LEAGUE_ID, 'currentSeason');
            const apiLeagueData = leagueDetailsResponse.data as SportMonksLeague; // Consider more specific typing if possible
            let dbLeague: League | null = null; // Use Prisma type directly
            if (apiLeagueData && apiLeagueData.id) {
                dbLeague = await prisma.league.findUnique({ where: { sportMonksId: apiLeagueData.id } });
                if (!dbLeague && typeof apiLeagueData.country_id === 'number') {
                    dbLeague = await prisma.league.create({
                        data: {
                            sportMonksId: apiLeagueData.id,
                            name: apiLeagueData.name,
                            countryId: apiLeagueData.country_id
                        }
                    });
                }
            }

            const currentSeasonData = apiLeagueData?.currentseason;
            let dbSeason: Season | null = null; // Use Prisma type directly
            if (currentSeasonData && currentSeasonData.id && dbLeague) {
                isSeasonFinished = currentSeasonData.finished;
                dbSeason = await prisma.season.findUnique({ where: { sportMonksId: currentSeasonData.id } });
                if (!dbSeason) {
                    dbSeason = await prisma.season.create({
                        data: {
                            sportMonksId: currentSeasonData.id,
                            name: currentSeasonData.name,
                            isCurrent: currentSeasonData.is_current ?? false,
                            leagueId: dbLeague.id
                        }
                    });
                }

                if (!isSeasonFinished && dbSeason) {
                    let targetRoundData: SportMonksRound | null = null;
                    let targetDbRound: Awaited<ReturnType<typeof prisma.round.findUnique>> | null = null;

                    if (
                        instanceRoundCUIDs &&
                        instanceRoundCUIDs.length > 0 &&
                        customNumberOfRounds &&
                        customNumberOfRounds > 0
                    ) {
                        // Game instance has a custom duration defined by specific rounds
                        const localInstanceRounds = await prisma.round.findMany({
                            where: { id: { in: instanceRoundCUIDs } },
                            orderBy: { startDate: 'asc' }
                        });

                        targetDbRound = localInstanceRounds.find((r) => new Date(r.endDate) >= new Date()) || null;

                        if (targetDbRound) {
                            // Fetch SportMonks data for this specific local round
                            // This assumes localRound.sportMonksId is populated correctly
                            const smRoundData = await getSeasonRounds(currentSeasonData.id); // Potentially optimize to get specific round by SM ID
                            targetRoundData =
                                smRoundData.data?.find((r: SportMonksRound) => r.id === targetDbRound!.sportMonksId) ||
                                null;
                        } else {
                            console.log(
                                `LMS: Custom duration game instance ${gameInstance.id} has no more upcoming rounds from its list.`
                            );
                            // No upcoming rounds in the custom list, game might be over or waiting for last round processing
                        }
                    } else {
                        // Default logic: game runs for the whole season, find current/next round
                        const roundsResponse = await getSeasonRounds(currentSeasonData.id);
                        const rounds: SportMonksRound[] = roundsResponse.data || [];
                        rounds.sort((a, b) => new Date(a.starting_at).getTime() - new Date(b.starting_at).getTime());
                        targetRoundData =
                            rounds.find((r) => new Date(r.ending_at) >= new Date()) ||
                            (rounds.length > 0 ? rounds[rounds.length - 1] : null);

                        if (targetRoundData && targetRoundData.id && dbLeague && dbSeason) {
                            targetDbRound = await prisma.round.findUnique({
                                where: { sportMonksId: targetRoundData.id }
                            });
                            if (!targetDbRound) {
                                const sDate = new Date(targetRoundData.starting_at);
                                const eDate = new Date(targetRoundData.ending_at);
                                if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
                                    targetDbRound = await prisma.round.create({
                                        data: {
                                            sportMonksId: targetRoundData.id,
                                            name: targetRoundData.name,
                                            startDate: sDate,
                                            endDate: eDate,
                                            seasonId: dbSeason.id,
                                            leagueId: dbLeague.id
                                        }
                                    });
                                }
                            }
                        }
                    }

                    if (targetDbRound) liveLmsCurrentRoundDbId = targetDbRound.id;

                    if (targetRoundData && targetRoundData.id) {
                        // Ensure we have a SportMonks round to fetch fixtures for
                        const roundFixturesResponse = await getRoundFixtures(targetRoundData.id); // Use SportMonks ID
                        const initialFixturesData: SportMonksFixture[] =
                            roundFixturesResponse.data?.fixtures?.data || roundFixturesResponse.data?.fixtures || [];

                        if (initialFixturesData.length > 0) {
                            const fixtureIds = initialFixturesData.map((f) => f.id).join(',');
                            const [participantsResp, scoresResp] = await Promise.all([
                                getFixturesDetailsByIds(fixtureIds, 'participants'),
                                getFixturesDetailsByIds(fixtureIds, 'scores')
                            ]);
                            const fixturesWithParticipants: SportMonksFixture[] = participantsResp.data || [];
                            const fixturesWithScores: SportMonksFixture[] = scoresResp.data || [];

                            liveFixtures = initialFixturesData.map((initFix) => {
                                const pData = fixturesWithParticipants.find((fp) => fp.id === initFix.id);
                                const sData = fixturesWithScores.find((fs) => fs.id === initFix.id);

                                return {
                                    ...initFix,
                                    participants: pData?.participants || [],
                                    scores: sData?.scores || []
                                };
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching LMS data:', error);
        }
    }

    const fixturesToPass = game.slug === 'last-man-standing' ? liveFixtures : [];
    const currentRoundIdToPass = game.slug === 'last-man-standing' ? liveLmsCurrentRoundDbId : null;

    let tablePredictorTeams: Array<{ id: number; name: string; image_path: string; country_id?: number }> = [];
    if (game.slug === 'table-predictor') {
        // Manual list for Premier League 2025/2026 with corrected IDs and image_paths
        const premierLeague2025_2026_Teams_Data = [
            { id: 19, name: 'Arsenal', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/19/19.png' },
            { id: 15, name: 'Aston Villa', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/15/15.png' },
            { id: 52, name: 'AFC Bournemouth', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/20/52.png' },
            { id: 236, name: 'Brentford', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/12/236.png' },
            {
                id: 78,
                name: 'Brighton & Hove Albion',
                image_path: 'https://cdn.sportmonks.com/images/soccer/teams/14/78.png'
            },
            { id: 27, name: 'Burnley', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/27/27.png' }, // Promoted
            { id: 18, name: 'Chelsea', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/18/18.png' },
            { id: 51, name: 'Crystal Palace', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/19/51.png' },
            { id: 13, name: 'Everton', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/13/13.png' },
            { id: 11, name: 'Fulham', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/11/11.png' },
            { id: 71, name: 'Leeds United', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/7/71.png' }, // Promoted
            { id: 8, name: 'Liverpool', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png' },
            { id: 9, name: 'Manchester City', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/9/9.png' },
            {
                id: 14,
                name: 'Manchester United',
                image_path: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png'
            },
            {
                id: 20,
                name: 'Newcastle United',
                image_path: 'https://cdn.sportmonks.com/images/soccer/teams/20/20.png'
            },
            {
                id: 63,
                name: 'Nottingham Forest',
                image_path: 'https://cdn.sportmonks.com/images/soccer/teams/31/63.png'
            },
            { id: 3, name: 'Sunderland', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/3/3.png' }, // Promoted
            { id: 6, name: 'Tottenham Hotspur', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/6/6.png' },
            { id: 1, name: 'West Ham United', image_path: 'https://cdn.sportmonks.com/images/soccer/teams/1/1.png' },
            {
                id: 29,
                name: 'Wolverhampton Wanderers',
                image_path: 'https://cdn.sportmonks.com/images/soccer/teams/29/29.png'
            }
        ];

        tablePredictorTeams = premierLeague2025_2026_Teams_Data.map((team) => ({
            id: team.id,
            name: team.name,
            image_path: team.image_path
            // country_id is not strictly needed for display here, and was causing Prisma issues
        }));
        console.log(
            `[Table Predictor] Using statically defined list of ${tablePredictorTeams.length} teams for 2025/2026 season.`
        );

        // Optional: Still attempt to fetch currentSeasonData for potential use elsewhere or for logging
        try {
            const leagueDetailsResponse = await getLeagueDetails(PREMIER_LEAGUE_ID, 'currentSeason');
            const currentSeasonData = leagueDetailsResponse.data?.currentseason;
            console.log(
                '[Table Predictor] currentSeasonData (for context):',
                JSON.stringify(currentSeasonData, null, 2)
            );

            // Upsert logic for these static teams (ensure they exist in DB for relations)
            // This part might need adjustment if currentSeasonData.id is not 25583
            // or if dbLeagueTP/dbSeasonTP logic needs to be more robust for static list
            if (currentSeasonData && currentSeasonData.id === 25583) {
                // Only upsert if context matches
                for (const team of tablePredictorTeams) {
                    let dbLeagueTP = await prisma.league.findUnique({ where: { sportMonksId: PREMIER_LEAGUE_ID } });
                    if (!dbLeagueTP && leagueDetailsResponse.data?.country_id && leagueDetailsResponse.data?.name) {
                        dbLeagueTP = await prisma.league.create({
                            data: {
                                sportMonksId: PREMIER_LEAGUE_ID,
                                name: leagueDetailsResponse.data.name,
                                countryId: leagueDetailsResponse.data.country_id
                            }
                        });
                    }

                    let dbSeasonTP = null;
                    if (dbLeagueTP) {
                        dbSeasonTP = await prisma.season.findUnique({
                            where: { sportMonksId: currentSeasonData.id } // Using 25583
                        });
                        if (!dbSeasonTP) {
                            dbSeasonTP = await prisma.season.create({
                                data: {
                                    sportMonksId: currentSeasonData.id,
                                    name: currentSeasonData.name, // Should be '2025/2026'
                                    isCurrent: true, // As per currentSeasonData
                                    leagueId: dbLeagueTP.id
                                }
                            });
                        }
                    }

                    if (dbLeagueTP && dbSeasonTP) {
                        const upsertData: any = {
                            name: team.name,
                            logoPath: team.image_path,
                            leagueId: dbLeagueTP.id,
                            seasonId: dbSeasonTP.id // Linking to the 2025/2026 season
                        };
                        await prisma.team.upsert({
                            where: { sportMonksId: team.id },
                            update: upsertData,
                            create: {
                                sportMonksId: team.id,
                                ...upsertData
                            }
                        });
                    } else {
                        console.error(
                            '[Table Predictor] Could not find/create local league/season for static team upsert.'
                        );
                    }
                }
            } else {
                console.warn(
                    '[Table Predictor] currentSeasonData.id is not 25583 or not available, skipping DB upsert for static teams for now.'
                );
            }
        } catch (error) {
            console.error('Error during static Table Predictor team setup or DB upsert:', error);
        }
    }

    const transformedWspFixtures: WspDisplayFixture[] = [];
    if (game.slug === 'weekly-score-predictor') {
        const leagueIdsForWsp = [PREMIER_LEAGUE_ID, CHAMPIONSHIP_ID, LEAGUE_ONE_ID, LEAGUE_TWO_ID];
        const fixturesPerLeague = 2;
        try {
            for (const leagueId of leagueIdsForWsp) {
                const leagueDetailsResponse = await getLeagueDetails(leagueId, 'currentSeason'); // Simplified include
                const apiLeagueData = leagueDetailsResponse.data as SportMonksLeague; // Consider more specific typing
                let dbLeagueWsp: League | null = null; // Use Prisma type directly
                if (apiLeagueData && apiLeagueData.id) {
                    dbLeagueWsp = await prisma.league.findUnique({ where: { sportMonksId: apiLeagueData.id } });
                    if (!dbLeagueWsp && typeof apiLeagueData.country_id === 'number') {
                        dbLeagueWsp = await prisma.league.create({
                            data: {
                                sportMonksId: apiLeagueData.id,
                                name: apiLeagueData.name,
                                countryId: apiLeagueData.country_id
                            }
                        });
                    }
                }

                const currentSeasonData = apiLeagueData?.currentseason;
                let dbSeasonWsp: Season | null = null; // Use Prisma type directly
                if (currentSeasonData && currentSeasonData.id && dbLeagueWsp) {
                    if (currentSeasonData.finished) continue; // Skip finished seasons
                    dbSeasonWsp = await prisma.season.findUnique({ where: { sportMonksId: currentSeasonData.id } });
                    if (!dbSeasonWsp) {
                        dbSeasonWsp = await prisma.season.create({
                            data: {
                                sportMonksId: currentSeasonData.id,
                                name: currentSeasonData.name,
                                isCurrent: currentSeasonData.is_current ?? false,
                                leagueId: dbLeagueWsp.id
                            }
                        });
                    }

                    const roundsResponse = await getSeasonRounds(currentSeasonData.id);
                    const rounds: SportMonksRound[] = roundsResponse.data || [];
                    rounds.sort((a, b) => new Date(a.starting_at).getTime() - new Date(b.starting_at).getTime());
                    const targetRoundData: SportMonksRound | null =
                        rounds.find((r) => new Date(r.ending_at) >= new Date()) ||
                        (rounds.length > 0 ? rounds[rounds.length - 1] : null);

                    if (targetRoundData && targetRoundData.id && dbLeagueWsp && dbSeasonWsp) {
                        let dbRoundWsp = await prisma.round.findUnique({ where: { sportMonksId: targetRoundData.id } });
                        if (!dbRoundWsp) {
                            const sDate = new Date(targetRoundData.starting_at);
                            const eDate = new Date(targetRoundData.ending_at);
                            if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
                                dbRoundWsp = await prisma.round.create({
                                    data: {
                                        sportMonksId: targetRoundData.id,
                                        name: targetRoundData.name,
                                        startDate: sDate,
                                        endDate: eDate,
                                        seasonId: dbSeasonWsp.id,
                                        leagueId: dbLeagueWsp.id
                                    }
                                });
                            }
                        }
                        if (!dbRoundWsp) continue;

                        const roundFixturesResponse = await getRoundFixtures(targetRoundData.id);
                        const initialFixtures: SportMonksFixture[] =
                            roundFixturesResponse.data?.fixtures?.data || roundFixturesResponse.data?.fixtures || [];

                        if (initialFixtures.length > 0) {
                            const fixtureIds = initialFixtures.map((f) => f.id).join(',');
                            const participantsResp = await getFixturesDetailsByIds(fixtureIds, 'participants');
                            const fixturesWithParticipants: SportMonksFixture[] = participantsResp.data || [];

                            const enrichedFixtures = initialFixtures.map((initFix) => {
                                const pData = fixturesWithParticipants.find((fp) => fp.id === initFix.id);

                                return { ...initFix, participants: pData?.participants || [] };
                            });

                            const shuffled = enrichedFixtures.sort(() => 0.5 - Math.random());
                            const selectedForLeague = shuffled.slice(0, fixturesPerLeague);

                            for (const smFix of selectedForLeague) {
                                if (!smFix.participants || smFix.participants.length < 2) continue;
                                const homeP = smFix.participants.find((p) => p.meta.location === 'home');
                                const awayP = smFix.participants.find((p) => p.meta.location === 'away');
                                if (!homeP || !awayP) continue;

                                const dbHomeTeam = await findOrCreateTeam(homeP, dbLeagueWsp.id, dbSeasonWsp.id);
                                const dbAwayTeam = await findOrCreateTeam(awayP, dbLeagueWsp.id, dbSeasonWsp.id);

                                let dbFixture = await prisma.fixture.findUnique({ where: { sportMonksId: smFix.id } });
                                if (!dbFixture) {
                                    dbFixture = await prisma.fixture.create({
                                        data: {
                                            sportMonksId: smFix.id,
                                            roundId: dbRoundWsp.id,
                                            leagueId: dbLeagueWsp.id,
                                            seasonId: dbSeasonWsp.id,
                                            homeTeamId: dbHomeTeam.id,
                                            awayTeamId: dbAwayTeam.id,
                                            matchDate: new Date(smFix.starting_at),
                                            status: 'NS' // Default status
                                        }
                                    });
                                }
                                transformedWspFixtures.push({
                                    id: dbFixture.id, // Use CUID for the component
                                    homeTeam: {
                                        id: String(dbHomeTeam.sportMonksId),
                                        name: dbHomeTeam.name,
                                        logoPath: dbHomeTeam.logoPath || ''
                                    },
                                    awayTeam: {
                                        id: String(dbAwayTeam.sportMonksId),
                                        name: dbAwayTeam.name,
                                        logoPath: dbAwayTeam.logoPath || ''
                                    },
                                    matchDate: smFix.starting_at
                                });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching WSP fixtures:', error);
        }
    }

    const raceTo33TeamPool: SportMonksParticipant[] = [];
    if (game.slug === 'race-to-33') {
        const leagueIdsForR33 = [PREMIER_LEAGUE_ID, CHAMPIONSHIP_ID, LEAGUE_ONE_ID, LEAGUE_TWO_ID];
        try {
            for (const leagueId of leagueIdsForR33) {
                const leagueDetailsResponse = await getLeagueDetails(leagueId, 'currentSeason'); // Simplified include
                const apiLeagueData = leagueDetailsResponse.data as SportMonksLeague; // Consider more specific typing
                let dbLeagueR33: League | null = null; // Use Prisma type directly
                if (apiLeagueData && apiLeagueData.id) {
                    dbLeagueR33 = await prisma.league.findUnique({ where: { sportMonksId: apiLeagueData.id } });
                    if (!dbLeagueR33 && typeof apiLeagueData.country_id === 'number') {
                        dbLeagueR33 = await prisma.league.create({
                            data: {
                                sportMonksId: apiLeagueData.id,
                                name: apiLeagueData.name,
                                countryId: apiLeagueData.country_id
                            }
                        });
                    }
                }

                const currentSeasonData = apiLeagueData?.currentseason;
                let dbSeasonR33: Season | null = null; // Use Prisma type directly
                if (currentSeasonData && currentSeasonData.id && dbLeagueR33) {
                    dbSeasonR33 = await prisma.season.findUnique({ where: { sportMonksId: currentSeasonData.id } });
                    if (!dbSeasonR33) {
                        dbSeasonR33 = await prisma.season.create({
                            data: {
                                sportMonksId: currentSeasonData.id,
                                name: currentSeasonData.name,
                                isCurrent: currentSeasonData.is_current ?? false,
                                leagueId: dbLeagueR33.id
                            }
                        });
                    }

                    if (dbSeasonR33) {
                        // Corrected call to getSeasonTeams: leagueId is undefined, 'country' is include
                        const teamsResponse = await getSeasonTeams(currentSeasonData.id, undefined, 'country');
                        if (teamsResponse && teamsResponse.data) {
                            for (const teamData of teamsResponse.data) {
                                const dbTeam = await findOrCreateTeam(
                                    teamData as SportMonksParticipant,
                                    dbLeagueR33.id,
                                    dbSeasonR33.id
                                );
                                raceTo33TeamPool.push({
                                    id: dbTeam.sportMonksId,
                                    name: dbTeam.name,
                                    image_path: dbTeam.logoPath || '',
                                    meta: { location: 'home' }
                                }); // meta is dummy here
                            }
                        }
                    }
                }
            }
            console.log(`Race to 33: Fetched ${raceTo33TeamPool.length} teams for the pool.`);
        } catch (error) {
            console.error('Error fetching Race to 33 team pool:', error);
        }
    }

    const dummyTeams = [
        { id: 'team-arsenal', name: 'Arsenal', logoPath: '/images/teams/arsenal.png' },
        { id: 'team-chelsea', name: 'Chelsea', logoPath: '/images/teams/chelsea.png' },
        { id: 'team-liverpool', name: 'Liverpool', logoPath: '/images/teams/liverpool.png' }
    ];

    const dummyWeeklyFixtures: WspDisplayFixture[] = [
        {
            id: 'fixture-1',
            homeTeam: { id: 'dteam-arsenal', name: 'Arsenal', logoPath: '/images/teams/arsenal.png' },
            awayTeam: { id: 'dteam-chelsea', name: 'Chelsea', logoPath: '/images/teams/chelsea.png' },
            matchDate: new Date().toISOString()
        }
    ];

    return (
        <div className='container mx-auto py-8'>
            <div className='mb-8 flex items-center justify-between'>
                <div className='flex-grow text-center'>
                    <h1 className='text-3xl font-bold'>{gameInstance.name}</h1> {/* Use typed gameInstance */}
                </div>
                {game.description && <GameRulesButton title={`${game.name} Rules`} description={game.description} />}
            </div>
            <Card className='mb-6'>
                <CardHeader className='text-center'>
                    <CardTitle className='text-center'>Game Details</CardTitle>
                    <CardDescription className='text-center'>{game.description}</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col items-center gap-2'>
                    <p>
                        <strong className='font-medium'>Game Type:</strong> {game.name}
                    </p>
                    <p>
                        <strong className='font-medium'>Status:</strong> {gameInstance.status}{' '}
                        {/* Use typed gameInstance */}
                    </p>
                    <p>
                        <strong className='font-medium'>Starts:</strong>{' '}
                        {new Date(gameInstance.startDate).toLocaleDateString()} {/* Use typed gameInstance */}
                    </p>
                    <p>
                        <strong className='font-medium'>Ends:</strong>{' '}
                        {new Date(gameInstance.endDate).toLocaleDateString()} {/* Use typed gameInstance */}
                    </p>
                    <p>
                        <strong className='font-medium'>Entry Fee:</strong> £{(gameInstance.entryFee / 100).toFixed(2)}{' '}
                        {/* Use typed gameInstance */}
                    </p>
                    <p>
                        <strong className='font-medium'>Prize Pool:</strong> £
                        {(gameInstance.prizePool / 100).toFixed(2)} {/* Use typed gameInstance */}
                    </p>
                </CardContent>
            </Card>
            {game.slug === 'last-man-standing' && (
                <LastManStandingGame
                    gameInstance={gameInstance} // Pass the correctly typed gameInstance
                    fixtures={fixturesToPass}
                    currentRoundId={currentRoundIdToPass}
                    isSeasonFinished={isSeasonFinished}
                />
            )}
            {game.slug === 'last-man-standing' && (
                <div className='mt-8'>
                    <LastManStandingLeaderboard gameInstanceId={gameInstance.id} /> {/* Use typed gameInstance */}
                </div>
            )}
            {game.slug === 'table-predictor' && (
                <TablePredictorGame
                    gameInstanceId={gameInstance.id} // Use typed gameInstance
                    initialTeams={
                        tablePredictorTeams.length > 0
                            ? tablePredictorTeams.map((t) => ({
                                  id: String(t.id),
                                  name: t.name,
                                  logoPath: t.image_path
                              }))
                            : dummyTeams
                    }
                />
            )}
            {game.slug === 'table-predictor' && (
                <div className='mt-8'>
                    <TablePredictorLeaderboard gameInstanceId={gameInstance.id} teams={dummyTeams} />{' '}
                    {/* Use typed gameInstance */}
                </div>
            )}
            {game.slug === 'weekly-score-predictor' && (
                <WeeklyScorePredictorGame
                    gameInstanceId={gameInstance.id} // Use typed gameInstance
                    initialFixtures={transformedWspFixtures.length > 0 ? transformedWspFixtures : dummyWeeklyFixtures}
                />
            )}
            {game.slug === 'weekly-score-predictor' && (
                <div className='mt-8'>
                    <WeeklyScorePredictorLeaderboard gameInstanceId={gameInstance.id} /> {/* Use typed gameInstance */}
                </div>
            )}
            {game.slug === 'race-to-33' && <RaceTo33Game gameInstanceId={gameInstance.id} />}{' '}
            {/* Use typed gameInstance */}
            {game.slug === 'race-to-33' && (
                <div className='mt-8'>
                    <RaceTo33Leaderboard gameInstanceId={gameInstance.id} /> {/* Use typed gameInstance */}
                </div>
            )}
        </div>
    );
}

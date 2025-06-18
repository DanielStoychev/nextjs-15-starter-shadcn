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
import { Game, GameInstance } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import {
    getFixturesDetailsByIds,
    getLeagueDetails,
    getRoundFixtures,
    getSeasonDetails,
    getSeasonRounds,
    getSeasonTeams
} from '@/lib/sportmonks-api';
// Import SportMonks functions
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

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

export default async function GamePage({ params }: GamePageProps) {
    const { gameSlug, instanceId } = await params;
    const gameInstance = await prisma.gameInstance.findUnique({ where: { id: instanceId }, include: { game: true } });

    if (!gameInstance || gameInstance.game.slug !== gameSlug) notFound();
    const game = gameInstance.game;

    let liveFixtures: SportMonksFixture[] = [];
    let liveLmsCurrentRoundDbId: string | null = null;
    let isSeasonFinished: boolean = false;

    if (game.slug === 'last-man-standing') {
        try {
            const leagueDetailsResponse = await getLeagueDetails(PREMIER_LEAGUE_ID, 'currentSeason');
            const apiLeagueData = leagueDetailsResponse.data as SportMonksLeague;
            let dbLeague: any = null;
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
            let dbSeason: any = null;
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
                    const roundsResponse = await getSeasonRounds(currentSeasonData.id);
                    const rounds: SportMonksRound[] = roundsResponse.data || [];
                    rounds.sort((a, b) => new Date(a.starting_at).getTime() - new Date(b.starting_at).getTime());
                    const targetRoundData: SportMonksRound | null =
                        rounds.find((r) => new Date(r.ending_at) >= new Date()) ||
                        (rounds.length > 0 ? rounds[rounds.length - 1] : null);

                    if (targetRoundData && targetRoundData.id && dbLeague && dbSeason) {
                        let dbRound = await prisma.round.findUnique({ where: { sportMonksId: targetRoundData.id } });
                        if (!dbRound) {
                            const sDate = new Date(targetRoundData.starting_at);
                            const eDate = new Date(targetRoundData.ending_at);
                            if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
                                dbRound = await prisma.round.create({
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
                        if (dbRound) liveLmsCurrentRoundDbId = dbRound.id;

                        const roundFixturesResponse = await getRoundFixtures(targetRoundData.id);
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

    let tablePredictorTeams: Array<{ id: number; name: string; image_path: string }> = [];
    if (game.slug === 'table-predictor') {
        try {
            const leagueDetailsResponse = await getLeagueDetails(PREMIER_LEAGUE_ID, 'currentSeason');
            const currentSeasonData = leagueDetailsResponse.data?.currentseason;

            console.log('[Table Predictor] currentSeasonData:', JSON.stringify(currentSeasonData, null, 2));
            if (currentSeasonData && currentSeasonData.id) {
                console.log(
                    `[Table Predictor] Attempting to fetch season details with teams for season ID: ${currentSeasonData.id}`
                );
                // Use getSeasonDetails with 'teams' include
                const seasonDetailsResponse = await getSeasonDetails(currentSeasonData.id, 'teams');
                console.log('[Table Predictor] seasonDetailsResponse:', JSON.stringify(seasonDetailsResponse, null, 2));

                // Assuming teams are nested under seasonDetailsResponse.data.teams
                // Adjust based on actual response structure logged above
                const teamsData = seasonDetailsResponse?.data?.teams;

                if (teamsData && Array.isArray(teamsData)) {
                    tablePredictorTeams = teamsData.map((apiTeam: any) => ({
                        id: apiTeam.id,
                        name: apiTeam.name,
                        image_path: apiTeam.image_path
                        // country_id is not reliably provided by season.teams include
                    }));

                    // Ensure teams are stored in the local DB
                    // This part might need adjustment based on how teams are structured in seasonDetailsResponse.data.teams
                    // and what's needed for findOrCreateTeam or direct prisma.team.upsert
                    for (const team of tablePredictorTeams) {
                        // Check if league and season CUIDs are available/needed for findOrCreateTeam
                        // For now, assuming direct upsert or that findOrCreateTeam can handle it
                        // This might require fetching local league/season if their CUIDs are needed for Team records
                        // and not directly available on team objects from season.teams include.
                        // For simplicity, let's assume we'll adapt the upsert.
                        // We need the local league and season CUIDs.
                        // We have apiLeagueData and currentSeasonData from earlier in the main GamePage scope,
                        // but we need their corresponding CUIDs from our DB.

                        // Let's find/create the league and season in DB first to get their CUIDs
                        let dbLeagueTP = await prisma.league.findUnique({ where: { sportMonksId: PREMIER_LEAGUE_ID } });
                        if (!dbLeagueTP && leagueDetailsResponse.data?.country_id) {
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
                                where: { sportMonksId: currentSeasonData.id }
                            });
                            if (!dbSeasonTP) {
                                dbSeasonTP = await prisma.season.create({
                                    data: {
                                        sportMonksId: currentSeasonData.id,
                                        name: currentSeasonData.name,
                                        isCurrent: currentSeasonData.is_current ?? false,
                                        leagueId: dbLeagueTP.id
                                    }
                                });
                            }
                        }

                        if (dbLeagueTP && dbSeasonTP) {
                            const teamUpsertDataUpdate: any = {
                                name: team.name,
                                logoPath: team.image_path,
                                leagueId: dbLeagueTP.id,
                                seasonId: dbSeasonTP.id
                            };
                            // countryId will not be set if not provided by API for season.teams include

                            const teamUpsertDataCreate: any = {
                                sportMonksId: team.id,
                                name: team.name,
                                logoPath: team.image_path,
                                leagueId: dbLeagueTP.id,
                                seasonId: dbSeasonTP.id
                            };
                            // countryId will not be set if not provided by API for season.teams include

                            await prisma.team.upsert({
                                where: { sportMonksId: team.id },
                                update: teamUpsertDataUpdate,
                                create: teamUpsertDataCreate
                            });
                        } else {
                            console.error(
                                '[Table Predictor] Could not find or create local league/season records for team upsert.'
                            );
                        }
                    }
                } else {
                    console.error(
                        '[Table Predictor] No teams data returned from getSeasonDetails or data is not in expected array format.'
                    );
                }
            } else {
                console.error(
                    '[Table Predictor] currentSeasonData or its ID is undefined after fetching league details.'
                );
            }
        } catch (error) {
            console.error('Error fetching Table Predictor teams:', error);
        }
    }

    const transformedWspFixtures: WspDisplayFixture[] = [];
    if (game.slug === 'weekly-score-predictor') {
        const leagueIdsForWsp = [PREMIER_LEAGUE_ID, CHAMPIONSHIP_ID, LEAGUE_ONE_ID, LEAGUE_TWO_ID];
        const fixturesPerLeague = 2;
        try {
            for (const leagueId of leagueIdsForWsp) {
                const leagueDetailsResponse = await getLeagueDetails(leagueId, 'currentSeason'); // Simplified include
                const apiLeagueData = leagueDetailsResponse.data as SportMonksLeague;
                let dbLeagueWsp: any = null;
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
                let dbSeasonWsp: any = null;
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
                const apiLeagueData = leagueDetailsResponse.data as SportMonksLeague;
                let dbLeagueR33: any = null;
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
                let dbSeasonR33: any = null;
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
                        const teamsResponse = await getSeasonTeams(currentSeasonData.id, 'country'); // image_path is part of default Team
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
                    <h1 className='text-3xl font-bold'>{gameInstance.name}</h1>
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
                        <strong className='font-medium'>Status:</strong> {gameInstance.status}
                    </p>
                    <p>
                        <strong className='font-medium'>Starts:</strong>{' '}
                        {new Date(gameInstance.startDate).toLocaleDateString()}
                    </p>
                    <p>
                        <strong className='font-medium'>Ends:</strong>{' '}
                        {new Date(gameInstance.endDate).toLocaleDateString()}
                    </p>
                    <p>
                        <strong className='font-medium'>Entry Fee:</strong> £{(gameInstance.entryFee / 100).toFixed(2)}
                    </p>
                    <p>
                        <strong className='font-medium'>Prize Pool:</strong> £
                        {(gameInstance.prizePool / 100).toFixed(2)}
                    </p>
                </CardContent>
            </Card>

            {game.slug === 'last-man-standing' && (
                <LastManStandingGame
                    gameInstance={gameInstance}
                    fixtures={fixturesToPass}
                    currentRoundId={currentRoundIdToPass}
                    isSeasonFinished={isSeasonFinished}
                />
            )}
            {game.slug === 'last-man-standing' && (
                <div className='mt-8'>
                    <LastManStandingLeaderboard gameInstanceId={gameInstance.id} />
                </div>
            )}

            {game.slug === 'table-predictor' && (
                <TablePredictorGame
                    gameInstanceId={gameInstance.id}
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
                    <TablePredictorLeaderboard gameInstanceId={gameInstance.id} teams={dummyTeams} />
                </div>
            )}

            {game.slug === 'weekly-score-predictor' && (
                <WeeklyScorePredictorGame
                    gameInstanceId={gameInstance.id}
                    initialFixtures={transformedWspFixtures.length > 0 ? transformedWspFixtures : dummyWeeklyFixtures}
                />
            )}
            {game.slug === 'weekly-score-predictor' && (
                <div className='mt-8'>
                    <WeeklyScorePredictorLeaderboard gameInstanceId={gameInstance.id} />
                </div>
            )}

            {game.slug === 'race-to-33' && <RaceTo33Game gameInstanceId={gameInstance.id} />}
            {game.slug === 'race-to-33' && (
                <div className='mt-8'>
                    <RaceTo33Leaderboard gameInstanceId={gameInstance.id} />
                </div>
            )}
        </div>
    );
}

// Load .env.local
// Load .env.local
import { PrismaClient } from '@prisma/client';

import {
    getLeagueDetails,
    getSeasonTeams
    // getSeasonDetails, // We might not need this if league details + seasons gives enough
} from '../src/lib/sportmonks-api';

// Corrected import path

const prisma = new PrismaClient();

// Define types for SportMonks API responses (simplified)
interface SportMonksLeague {
    id: number;
    name: string;
    country_id: number;
    image_path: string;
    seasons?: SportMonksSeason[]; // Included if requested
}

interface SportMonksSeason {
    id: number;
    name: string;
    league_id: number;
    is_current_season?: boolean; // SportMonks might use this
    start_date?: string;
    end_date?: string;
    year?: number;
}

interface SportMonksTeam {
    id: number;
    name: string;
    short_code?: string;
    country_id?: number;
    image_path: string; // This should be the direct CDN URL
    venue_id?: number;
}

const TARGET_LEAGUES = [
    { sportMonksId: 8, name: 'Premier League', countryId: 462 }, // England
    { sportMonksId: 9, name: 'Championship', countryId: 462 },
    { sportMonksId: 12, name: 'League One', countryId: 462 },
    { sportMonksId: 14, name: 'League Two', countryId: 462 }
];

const TARGET_SEASON_NAME = '2025/2026';

async function main() {
    console.log('--- STARTING SEED SCRIPT (TypeScript Version) ---');
    await prisma.$connect();
    console.log('--- Prisma Client Connected ---');

    // Clear existing data - keep this part
    await prisma.lastManStandingPick.deleteMany({});
    await prisma.tablePredictorPrediction.deleteMany({});
    await prisma.weeklyScorePrediction.deleteMany({});
    await prisma.raceTo33Assignment.deleteMany({});
    await prisma.userGameEntry.deleteMany({});
    await prisma.gameInstance.deleteMany({});
    // await prisma.game.deleteMany({}); // Keep games if they are static definitions

    // Clear SportMonks related data carefully
    await prisma.fixture.deleteMany({});
    await prisma.round.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.season.deleteMany({});
    await prisma.league.deleteMany({});
    console.log(
        'Cleaned up existing dynamic data (picks, entries, instances, fixtures, rounds, teams, seasons, leagues).'
    );

    // Create Game entities (static definitions, can be kept)
    const gamesData = [
        {
            slug: 'last-man-standing',
            name: 'Last Man Standing',
            description:
                'Pick one Premier League team per gameweek to WIN their match. You cannot pick the same team twice during the season. If your chosen team fails to win, you are eliminated from the competition. The last player(s) remaining wins the prize pool. Strategy is key - save your strongest teams for the crucial later weeks!'
        },
        {
            slug: 'table-predictor',
            name: 'Premier League Table Predictor',
            description:
                'Arrange all 20 Premier League teams in order from 1st to 20th to predict the final league table at the end of the season. Points are awarded based on how close your predictions are to the actual final positions. The more accurate your predictions, the higher your score. Perfect for fans who think they know how the season will unfold!'
        },
        {
            slug: 'weekly-score-predictor',
            name: 'Weekly Score Predictor',
            description:
                'Predict the exact scores for a selection of Premier League matches each gameweek. Earn points for correct results, goal differences, and exact score predictions. Compete against other players weekly with fresh fixtures to predict. Perfect for fans who love analyzing individual matches and predicting outcomes!'
        },
        {
            slug: 'race-to-33',
            name: 'Race to 33',
            description:
                "Users are randomly assigned 4 teams from the Premier League at the start of the season. Your goal is to be the first player whose teams collectively score 33 points in the league table. Monitor your teams' progress and hope they perform well in the real Premier League. First to reach 33 points wins the competition!"
        }
    ];

    for (const game of gamesData) {
        await prisma.game.upsert({
            where: { slug: game.slug },
            update: { name: game.name, description: game.description },
            create: game
        });
    }
    console.log('Upserted Game definitions.');

    // --- DYNAMIC SEEDING FOR TARGET LEAGUES AND 2025/2026 SEASON ---
    console.log(`--- Starting dynamic seeding for ${TARGET_SEASON_NAME} ---`);

    for (const leagueInfo of TARGET_LEAGUES) {
        console.log(`Processing League: ${leagueInfo.name} (ID: ${leagueInfo.sportMonksId})`);

        try {
            // 1. Fetch League Details with all its seasons
            const leagueDetailsResponse = await getLeagueDetails(leagueInfo.sportMonksId, 'seasons');
            const leagueApiData = leagueDetailsResponse.data as SportMonksLeague;

            if (!leagueApiData) {
                console.error(`Could not fetch details for league ID ${leagueInfo.sportMonksId}. Skipping.`);
                continue;
            }

            // Upsert League
            const localLeague = await prisma.league.upsert({
                where: { sportMonksId: leagueInfo.sportMonksId },
                update: {
                    name: leagueApiData.name || leagueInfo.name,
                    countryId: leagueApiData.country_id || leagueInfo.countryId
                    // logoPath: leagueApiData.image_path, // Not in schema
                    // active: true, // Not in schema
                },
                create: {
                    sportMonksId: leagueInfo.sportMonksId,
                    name: leagueApiData.name || leagueInfo.name,
                    countryId: leagueApiData.country_id || leagueInfo.countryId
                    // logoPath: leagueApiData.image_path, // Not in schema
                    // active: true, // Not in schema
                }
            });
            console.log(`Upserted League: ${localLeague.name} (Local ID: ${localLeague.id})`);

            // 2. Find the target 2025/2026 season
            const targetSeasonApiData = leagueApiData.seasons?.find((s) => s.name === TARGET_SEASON_NAME);

            if (!targetSeasonApiData || !targetSeasonApiData.id) {
                console.warn(
                    `Season '${TARGET_SEASON_NAME}' not found for league ${leagueInfo.name} (ID: ${leagueInfo.sportMonksId}) via API. Skipping season and team seeding for this league.`
                );
                continue;
            }
            console.log(
                `Found ${TARGET_SEASON_NAME} season for ${leagueInfo.name} (SportMonks Season ID: ${targetSeasonApiData.id})`
            );

            // 3. Upsert the 2025/2026 Season
            const localSeason = await prisma.season.upsert({
                where: { sportMonksId: targetSeasonApiData.id },
                update: {
                    name: targetSeasonApiData.name,
                    leagueId: localLeague.id,
                    isCurrent: targetSeasonApiData.is_current_season || false // Default to false for a future season
                    // startDate, endDate, year not in schema
                },
                create: {
                    sportMonksId: targetSeasonApiData.id,
                    name: targetSeasonApiData.name,
                    leagueId: localLeague.id,
                    isCurrent: targetSeasonApiData.is_current_season || false
                    // startDate, endDate, year not in schema
                }
            });
            console.log(`Upserted Season: ${localSeason.name} for ${leagueInfo.name} (Local ID: ${localSeason.id})`);

            // 4. Fetch Teams for this 2025/2026 Season
            // The getSeasonTeams helper seems to fetch by /teams?season_id={id}
            // We might need to include 'details' or 'country' if not default
            const teamsResponse = await getSeasonTeams(
                targetSeasonApiData.id,
                leagueInfo.sportMonksId
                // 'country,venue' // Removed problematic include
            ); // Pass leagueId for context if helper uses it
            const teamsApiData = teamsResponse.data as SportMonksTeam[];

            if (!teamsApiData || teamsApiData.length === 0) {
                console.warn(
                    `No teams found for season ${targetSeasonApiData.name} (ID: ${targetSeasonApiData.id}) in league ${leagueInfo.name}.`
                );
                continue;
            }
            console.log(`Fetched ${teamsApiData.length} teams for ${localSeason.name} in ${leagueInfo.name}.`);

            // 5. Upsert Teams
            for (const teamApiData of teamsApiData) {
                if (!teamApiData.id || !teamApiData.name) {
                    console.warn('Skipping team with missing ID or name:', teamApiData);
                    continue;
                }
                await prisma.team.upsert({
                    where: { sportMonksId: teamApiData.id },
                    update: {
                        name: teamApiData.name,
                        logoPath: teamApiData.image_path, // Direct CDN URL
                        // shortCode, countryId, venueId not in schema
                        leagueId: localLeague.id, // Link to the local league
                        seasonId: localSeason.id // Link to the specific 2025/2026 local season
                    },
                    create: {
                        sportMonksId: teamApiData.id,
                        name: teamApiData.name,
                        logoPath: teamApiData.image_path,
                        // shortCode, countryId, venueId not in schema
                        leagueId: localLeague.id,
                        seasonId: localSeason.id
                    }
                });
            }
            console.log(`Upserted ${teamsApiData.length} teams for ${localSeason.name} in ${leagueInfo.name}.`);
        } catch (error) {
            console.error(`Error processing league ${leagueInfo.name} (ID: ${leagueInfo.sportMonksId}):`, error);
        }
    }
    console.log(`--- Finished dynamic seeding for ${TARGET_SEASON_NAME} ---`);

    // Keep dummy data for other things if needed, e.g., specific rounds/fixtures for testing
    // For example, the dummy Premier League 2024/2025 setup for LMS testing:
    const premierLeague2425 = await prisma.league.upsert({
        where: { sportMonksId: 8 }, // Assuming PL SportMonks ID is 8
        update: { name: 'Premier League', countryId: 462 /* active not in schema */ },
        create: { sportMonksId: 8, name: 'Premier League', countryId: 462 /* active not in schema */ }
    });
    const plSeason2425 = await prisma.season.upsert({
        where: { sportMonksId: 23614 }, // Actual SportMonks ID for PL 24/25
        update: { name: '2024/2025', leagueId: premierLeague2425.id, isCurrent: true },
        create: { sportMonksId: 23614, name: '2024/2025', leagueId: premierLeague2425.id, isCurrent: true }
    });
    const dummyRoundForLMS = await prisma.round.upsert({
        where: { sportMonksId: 123456789 },
        update: {},
        create: {
            sportMonksId: 123456789, // Unique dummy ID
            seasonId: plSeason2425.id,
            leagueId: premierLeague2425.id,
            name: 'Dummy Gameweek 1 (24/25)',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });
    console.log('Re-created dummy 2024/2025 PL Season and Round for LMS testing.');

    // Example: Create game instances (can be kept or adapted)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const gameSlugs = ['last-man-standing', 'table-predictor', 'weekly-score-predictor', 'race-to-33'];
    for (const slug of gameSlugs) {
        const game = await prisma.game.findUnique({ where: { slug } });
        if (game) {
            await prisma.gameInstance.upsert({
                where: { id: `${slug}-instance-${now.getFullYear()}-${now.getMonth() + 1}` },
                update: {
                    name: `${game.name} - Instance ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
                    startDate: now,
                    endDate: nextMonth,
                    status: 'PENDING'
                },
                create: {
                    id: `${slug}-instance-${now.getFullYear()}-${now.getMonth() + 1}`,
                    gameId: game.id,
                    name: `${game.name} - Instance ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
                    startDate: now,
                    endDate: nextMonth,
                    status: 'PENDING',
                    entryFee:
                        slug === 'last-man-standing'
                            ? 1000
                            : slug === 'table-predictor'
                              ? 500
                              : slug === 'race-to-33'
                                ? 300
                                : 200,
                    prizePool: 0
                }
            });
            console.log(`Upserted GameInstance for ${game.name}`);
        }
    }
}

(async () => {
    try {
        await main();
        console.log('--- SEED SCRIPT COMPLETED SUCCESSFULLY ---');
    } catch (e) {
        console.error('--- ERROR IN SEED SCRIPT ---:', e);
        process.exit(1);
    } finally {
        console.log('--- Disconnecting Prisma Client... ---');
        await prisma.$disconnect();
        console.log('--- Prisma Client disconnected. ---');
    }
})();

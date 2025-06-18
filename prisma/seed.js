import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.$connect(); // Explicitly connect before operations

    // Ensure deletion order respects foreign key constraints
    // Delete dependent records first
    await prisma.lastManStandingPick.deleteMany({});
    await prisma.tablePredictorPrediction.deleteMany({});
    await prisma.weeklyScorePrediction.deleteMany({});
    await prisma.raceTo33Assignment.deleteMany({}); // New: Delete RaceTo33Assignment
    await prisma.userGameEntry.deleteMany({});
    await prisma.gameInstance.deleteMany({});
    await prisma.game.deleteMany({});
    // Delete SportMonks related data in correct order
    await prisma.fixture.deleteMany({});
    await prisma.round.deleteMany({});
    await prisma.team.deleteMany({}); // Delete teams before seasons
    await prisma.season.deleteMany({});
    await prisma.league.deleteMany({});

    console.log('Cleaned up existing data.');

    // Create Game entries
    const lastManStanding = await prisma.game.upsert({
        where: { slug: 'last-man-standing' },
        update: {},
        create: {
            name: 'Last Man Standing',
            slug: 'last-man-standing',
            description:
                'Pick one Premier League team per gameweek to WIN. If the team wins, you progress. If not (draw or loss), you are eliminated. Cannot reuse previously picked teams within the same competition cycle. If all active players are eliminated in a given round, the prize pool rolls over to the next game cycle, and all players must pay to rejoin a new game.'
        }
    });

    const tablePredictor = await prisma.game.upsert({
        where: { slug: 'table-predictor' },
        update: {},
        create: {
            name: 'Premier League Table Predictor',
            slug: 'table-predictor',
            description:
                'Arrange all 20 Premier League teams in the order you predict the table will finish at the end of the season. Predict the total number of goals scored in the Premier League season by all teams combined for tie-breaking.'
        }
    });

    // Delete old game instances for Weekly Score Predictor to ensure clean state
    await prisma.gameInstance.deleteMany({
        where: {
            game: {
                slug: 'weekly-score-predictor'
            }
        }
    });

    const weeklyScorePredictor = await prisma.game.upsert({
        where: { slug: 'weekly-score-predictor' },
        update: {},
        create: {
            name: 'Weekly Score Predictor',
            slug: 'weekly-score-predictor',
            description:
                'Predict the exact scores for a selection of matches (2 randomly selected from each of the Premier League, Championship, League One, and League Two) for the upcoming gameweek. Points are awarded: 5 for correct score, 2 for correct result (win/draw/loss) but incorrect score, 0 for incorrect result. Monthly prize with running leaderboards.'
        }
    });

    const raceTo33 = await prisma.game.upsert({
        where: { slug: 'race-to-33' },
        update: {},
        create: {
            name: 'Race to 33',
            slug: 'race-to-33',
            description:
                "Users are randomly assigned 4 teams, one from each of four different English Football League clubs (Premier League, Championship, League One, and League Two). Each gameweek, the goals scored by their four assigned teams are tallied. The first user(s) whose combined team goals reach EXACTLY 33 wins. If multiple winners in the same week, it's a rollover, and players must pay to rejoin."
        }
    });

    console.log('Created Games:', { lastManStanding, tablePredictor, weeklyScorePredictor, raceTo33 });

    // Seed a dummy Premier League, Season, and Round for testing LMS picks
    const premierLeague = await prisma.league.upsert({
        where: { sportMonksId: 8 },
        update: {},
        create: {
            sportMonksId: 8,
            name: 'Premier League',
            countryId: 462 // England's country ID
        }
    });

    const plSeason = await prisma.season.upsert({
        where: { sportMonksId: 23614 }, // Use the ID from the SportMonks API response
        update: {},
        create: {
            sportMonksId: 23614,
            leagueId: premierLeague.id,
            name: '2024/2025',
            isCurrent: true
        }
    });

    const dummyRound = await prisma.round.upsert({
        where: { sportMonksId: 123456789 }, // A unique dummy ID
        update: {},
        create: {
            sportMonksId: 123456789,
            seasonId: plSeason.id,
            leagueId: premierLeague.id,
            name: 'Dummy Gameweek 1',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
    });

    console.log('Created SportMonks Data:', { premierLeague, plSeason, dummyRound });

    // Seed dummy teams for fixtures
    const dummyTeams = [
        { id: 'team-arsenal', sportMonksId: 1, name: 'Arsenal', logoPath: '/images/teams/arsenal.png' },
        { id: 'team-chelsea', sportMonksId: 2, name: 'Chelsea', logoPath: '/images/teams/chelsea.png' },
        { id: 'team-liverpool', sportMonksId: 3, name: 'Liverpool', logoPath: '/images/teams/liverpool.png' },
        { id: 'team-man-utd', sportMonksId: 4, name: 'Man Utd', logoPath: '/images/teams/man_utd.png' },
        { id: 'team-tottenham', sportMonksId: 5, name: 'Tottenham', logoPath: '/images/teams/tottenham.png' }, // sportMonksId 5 for variety
        { id: 'team-newcastle', sportMonksId: 6, name: 'Newcastle', logoPath: '/images/teams/newcastle.png' } // sportMonksId 6 for variety
    ];

    for (const teamData of dummyTeams) {
        await prisma.team.upsert({
            // Use sportMonksId for where clause if it's the intended unique business key from SportMonks
            // However, current schema has id as @id and sportMonksId as @unique.
            // Sticking to id for upsert's where, but ensuring sportMonksId is set correctly.
            where: { id: teamData.id },
            update: {
                // Ensure sportMonksId is updated if record exists but has a random one
                sportMonksId: teamData.sportMonksId,
                name: teamData.name,
                logoPath: teamData.logoPath,
                leagueId: premierLeague.id,
                seasonId: plSeason.id
            },
            create: {
                id: teamData.id,
                sportMonksId: teamData.sportMonksId, // Use specific SportMonks ID
                name: teamData.name,
                logoPath: teamData.logoPath,
                leagueId: premierLeague.id,
                seasonId: plSeason.id
            }
        });
    }
    console.log('Created Dummy Teams.');

    // Delete old fixtures to ensure clean state
    await prisma.fixture.deleteMany({
        where: {
            id: {
                in: ['fixture-1', 'fixture-2', 'fixture-3']
            }
        }
    });

    // Seed dummy fixtures for Weekly Score Predictor
    const fixture1 = await prisma.fixture.upsert({
        where: { id: 'fixture-1' },
        update: {},
        create: {
            id: 'fixture-1',
            sportMonksId: 1001,
            roundId: dummyRound.id,
            leagueId: premierLeague.id,
            seasonId: plSeason.id,
            homeTeamId: 'team-arsenal', // Assuming these team IDs exist from previous seeds or will be added
            awayTeamId: 'team-chelsea',
            homeScore: null,
            awayScore: null,
            status: 'NS', // Not Started
            matchDate: new Date(Date.now() + 86400000) // Tomorrow
        }
    });

    const fixture2 = await prisma.fixture.upsert({
        where: { id: 'fixture-2' },
        update: {},
        create: {
            id: 'fixture-2',
            sportMonksId: 1002,
            roundId: dummyRound.id,
            leagueId: premierLeague.id,
            seasonId: plSeason.id,
            homeTeamId: 'team-liverpool',
            awayTeamId: 'team-man-utd',
            homeScore: null,
            awayScore: null,
            status: 'NS',
            matchDate: new Date(Date.now() + 172800000) // Day after tomorrow
        }
    });

    const fixture3 = await prisma.fixture.upsert({
        where: { id: 'fixture-3' },
        update: {},
        create: {
            id: 'fixture-3',
            sportMonksId: 1003,
            roundId: dummyRound.id,
            leagueId: premierLeague.id,
            seasonId: plSeason.id,
            homeTeamId: 'team-tottenham',
            awayTeamId: 'team-newcastle',
            homeScore: null,
            awayScore: null,
            status: 'NS',
            matchDate: new Date(Date.now() + 259200000) // 3 days from now
        }
    });

    console.log('Created Fixtures:', { fixture1, fixture2, fixture3 });

    // Example: Create a game instance for Last Man Standing
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);

    const lmsInstance = await prisma.gameInstance.upsert({
        where: { id: 'lms-aug-2025' }, // Use a fixed ID for upsert to avoid duplicates on re-run
        update: {},
        create: {
            id: 'lms-aug-2025',
            gameId: lastManStanding.id,
            name: 'Last Man Standing - August 2025',
            startDate: now,
            endDate: nextMonth,
            status: 'PENDING',
            entryFee: 1000, // £10.00
            prizePool: 0
        }
    });

    console.log('Created LMS Instance:', { lmsInstance });

    // Example: Create a game instance for Table Predictor
    const tablePredictorInstance = await prisma.gameInstance.upsert({
        where: { id: 'table-predictor-aug-2025' }, // Fixed ID for upsert
        update: {},
        create: {
            id: 'table-predictor-aug-2025',
            gameId: tablePredictor.id,
            name: 'Premier League Table Predictor - August 2025',
            startDate: now,
            endDate: nextMonth,
            status: 'PENDING',
            entryFee: 500, // £5.00
            prizePool: 0
        }
    });

    console.log('Created Table Predictor Instance:', { tablePredictorInstance });

    // Example: Create a game instance for Weekly Score Predictor
    const weeklyScorePredictorInstance = await prisma.gameInstance.upsert({
        where: { id: 'weekly-score-predictor-aug-2025' }, // Fixed ID for upsert
        update: {},
        create: {
            id: 'weekly-score-predictor-aug-2025',
            gameId: weeklyScorePredictor.id,
            name: 'Weekly Score Predictor - August 2025',
            startDate: now,
            endDate: nextMonth,
            status: 'PENDING',
            entryFee: 200, // £2.00
            prizePool: 0
        }
    });

    console.log('Created Weekly Score Predictor Instance:', { weeklyScorePredictorInstance });

    // Example: Create a game instance for Race to 33
    const raceTo33Instance = await prisma.gameInstance.upsert({
        where: { id: 'race-to-33-aug-2025' }, // Fixed ID for upsert
        update: {},
        create: {
            id: 'race-to-33-aug-2025',
            gameId: raceTo33.id,
            name: 'Race to 33 - August 2025',
            startDate: now,
            endDate: nextMonth,
            status: 'PENDING',
            entryFee: 300, // £3.00
            prizePool: 0
        }
    });

    console.log('Created Race to 33 Instance:', { raceTo33Instance });
}

(async () => {
    try {
        await main();
    } catch (e) {
        console.error('Error in seed script:', e);
        process.exit(1);
    } finally {
        console.log('Disconnecting Prisma Client...');
        await prisma.$disconnect();
        console.log('Prisma Client disconnected.');
    }
})();

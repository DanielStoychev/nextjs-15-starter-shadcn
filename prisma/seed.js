import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Delete old game instances for Table Predictor to ensure clean state
    await prisma.gameInstance.deleteMany({
        where: {
            game: {
                slug: 'premier-league-table-predictor' // Old slug
            }
        }
    });
    await prisma.gameInstance.deleteMany({
        where: {
            game: {
                slug: 'table-predictor' // Current slug, to clear any previous instances
            }
        }
    });

    // Delete old game entry if it exists to ensure clean slug update
    await prisma.game.deleteMany({
        where: {
            slug: 'premier-league-table-predictor'
        }
    });

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
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

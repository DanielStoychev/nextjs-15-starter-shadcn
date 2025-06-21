import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugLMSData() {
    try {
        console.log('🔍 Debugging LMS Database State...');
        console.log('Current date:', new Date().toISOString());

        // Check if we have any seasons in the database
        console.log('\n🗄️ Checking database for seasons...');
        const seasons = await prisma.season.findMany({
            include: {
                league: true,
                rounds: {
                    orderBy: { startDate: 'asc' }
                }
            }
        });

        console.log(`Found ${seasons.length} seasons in database:`);
        seasons.forEach((season, index) => {
            console.log(`  ${index + 1}. ${season.name} (${season.league.name})`);
            console.log(`     SportMonks ID: ${season.sportMonksId}`);
            console.log(`     Is Current: ${season.isCurrent}`);
            console.log(`     Rounds: ${season.rounds.length}`);

            if (season.rounds.length > 0) {
                console.log('     Available rounds:');
                season.rounds.forEach((round, rIndex) => {
                    const now = new Date();
                    const startDate = new Date(round.startDate);
                    const endDate = new Date(round.endDate);

                    console.log(`       ${rIndex + 1}. ${round.name} (SM ID: ${round.sportMonksId})`);
                    console.log(`          Start: ${startDate.toISOString()}`);
                    console.log(`          End: ${endDate.toISOString()}`);
                    console.log(
                        `          Status: ${endDate < now ? 'Finished' : startDate <= now ? 'Ongoing' : 'Upcoming'}`
                    );
                });
            }
        });

        // Check Premier League specifically
        console.log('\n⚽ Checking Premier League data...');
        const premierLeague = await prisma.league.findUnique({
            where: { sportMonksId: 8 }, // Premier League SportMonks ID
            include: {
                seasons: {
                    where: { isCurrent: true },
                    include: {
                        rounds: {
                            orderBy: { startDate: 'asc' }
                        }
                    }
                }
            }
        });

        if (premierLeague) {
            console.log('Premier League found in database');
            console.log(`Current seasons: ${premierLeague.seasons.length}`);

            premierLeague.seasons.forEach((season) => {
                console.log(`  Season: ${season.name}`);
                console.log(`  Rounds: ${season.rounds.length}`);

                if (season.rounds.length > 0) {
                    const now = new Date();
                    const upcomingOrOngoingRounds = season.rounds.filter((r) => new Date(r.endDate) >= now);
                    console.log(`  Upcoming/Ongoing rounds: ${upcomingOrOngoingRounds.length}`);

                    if (upcomingOrOngoingRounds.length > 0) {
                        const firstUpcoming = upcomingOrOngoingRounds[0];
                        console.log(`  First upcoming/ongoing: ${firstUpcoming.name} (${firstUpcoming.id})`);
                    } else if (season.rounds.length > 0) {
                        console.log(`  Would use first round: ${season.rounds[0].name} (${season.rounds[0].id})`);
                    }
                }
            });
        } else {
            console.log('❌ Premier League not found in database');
        }

        // Check game instances
        console.log('\n🎮 Checking Last Man Standing game instances...');
        const lmsGameInstances = await prisma.gameInstance.findMany({
            where: {
                game: {
                    slug: 'last-man-standing'
                }
            },
            include: {
                game: true,
                userEntries: true
            }
        });

        console.log(`Found ${lmsGameInstances.length} LMS game instances:`);
        lmsGameInstances.forEach((instance, index) => {
            console.log(`  ${index + 1}. ${instance.name} (${instance.id})`);
            console.log(`     Status: ${instance.status}`);
            console.log(`     Entries: ${instance.userEntries.length}`);
            console.log(`     Start: ${new Date(instance.startDate).toISOString()}`);
            console.log(`     End: ${new Date(instance.endDate).toISOString()}`);
        });
    } catch (error) {
        console.error('❌ Error in debug script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugLMSData().catch(console.error);

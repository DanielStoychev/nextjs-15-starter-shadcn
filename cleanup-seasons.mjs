import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupSeasons() {
    try {
        console.log('🧹 Cleaning up seasons...');

        // First, let's see what we have
        const seasons = await prisma.season.findMany({
            include: {
                league: true,
                rounds: true
            }
        });

        console.log('Current seasons:');
        seasons.forEach((season, index) => {
            console.log(`  ${index + 1}. ${season.name} (ID: ${season.id})`);
            console.log(`     SportMonks ID: ${season.sportMonksId}`);
            console.log(`     Is Current: ${season.isCurrent}`);
            console.log(`     Rounds: ${season.rounds.length}`);
        });

        // Find the 2024/2025 season
        const oldSeason = seasons.find((s) => s.name.includes('2024/2025') || s.name.includes('24/25'));
        const newSeason = seasons.find((s) => s.name.includes('2025/2026') || s.name.includes('25/26'));

        if (oldSeason) {
            console.log(`\n🗑️ Removing old season: ${oldSeason.name}`);

            // Delete rounds from old season first
            await prisma.round.deleteMany({
                where: { seasonId: oldSeason.id }
            });
            console.log(`   Deleted rounds for ${oldSeason.name}`);

            // Delete the old season
            await prisma.season.delete({
                where: { id: oldSeason.id }
            });
            console.log(`   Deleted season ${oldSeason.name}`);
        }

        if (newSeason) {
            console.log(`\n✅ Updating ${newSeason.name} to be current season`);
            await prisma.season.update({
                where: { id: newSeason.id },
                data: { isCurrent: true }
            });
            console.log(`   Set ${newSeason.name} as current season`);
        }

        // Verify the changes
        console.log('\n📊 Final database state:');
        const finalSeasons = await prisma.season.findMany({
            include: {
                league: true,
                rounds: true
            }
        });

        finalSeasons.forEach((season, index) => {
            console.log(`  ${index + 1}. ${season.name} (ID: ${season.id})`);
            console.log(`     SportMonks ID: ${season.sportMonksId}`);
            console.log(`     Is Current: ${season.isCurrent}`);
            console.log(`     Rounds: ${season.rounds.length}`);
            season.rounds.forEach((round, rIndex) => {
                const status =
                    new Date(round.endDate) < new Date()
                        ? 'Finished'
                        : new Date(round.startDate) <= new Date()
                          ? 'Ongoing'
                          : 'Upcoming';
                console.log(`       ${rIndex + 1}. ${round.name} (${status})`);
            });
        });

        console.log('\n🎉 Cleanup completed successfully!');
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupSeasons().catch(console.error);

/**
 * Fixture Update Job
 * Automatically fetches and updates fixture data from SportMonks API
 */
import { PrismaClient } from '@prisma/client';

import { getFixturesByDateRange } from '../sportmonks-api';

const prisma = new PrismaClient();

export async function fixtureUpdateJob(): Promise<void> {
    console.log('🔄 Starting fixture update job...');

    try {
        // Get fixtures for the next 7 days and last 7 days
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);

        const startDate = lastWeek.toISOString().split('T')[0];
        const endDate = nextWeek.toISOString().split('T')[0];

        console.log(`Fetching fixtures from ${startDate} to ${endDate}`);

        // Fetch fixtures from SportMonks API
        const response = await getFixturesByDateRange(startDate, endDate, {
            include: 'participants,scores,state,round,league'
        });
        if (!response.data || !Array.isArray(response.data)) {
            console.log('No fixture data received from API');

            return;
        }

        const fixtures = Array.isArray(response.data) ? response.data : [response.data];
        let updatedCount = 0;
        const newCount = 0;

        for (const fixture of fixtures) {
            try {
                // Check if fixture already exists
                const existingFixture = await prisma.fixture.findUnique({
                    where: { sportMonksId: fixture.id }
                });

                const fixtureData = {
                    sportMonksId: fixture.id,
                    matchDate: new Date(fixture.starting_at),
                    status: fixture.state?.short_name || 'SCHEDULED',
                    homeScore: fixture.scores?.[0]?.score?.goals || null,
                    awayScore: fixture.scores?.[1]?.score?.goals || null
                };

                if (existingFixture) {
                    // Update existing fixture
                    await prisma.fixture.update({
                        where: { id: existingFixture.id },
                        data: fixtureData
                    });
                    updatedCount++;
                } else {
                    // Create new fixture (if we have the required relationships)
                    // Note: This would require proper team/league/round mapping
                    // For now, we'll just update existing fixtures
                    console.log(`Skipping new fixture ${fixture.id} - requires relationship mapping`);
                }
            } catch (error) {
                console.error(`Error processing fixture ${fixture.id}:`, error);
            }
        }

        console.log(`✅ Fixture update completed: ${updatedCount} updated, ${newCount} new`);
    } catch (error) {
        console.error('❌ Fixture update job failed:', error);
        throw error;
    }
}

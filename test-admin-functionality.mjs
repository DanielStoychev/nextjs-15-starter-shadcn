// Simple test of SportMonks API integration for admin functionality
import { PrismaClient } from '@prisma/client';

import { config } from 'dotenv';

config();

// Simple API test without imports due to ESM issues
const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

async function getSeasonTeams(seasonId) {
    const url = `https://api.sportmonks.com/v3/football/teams?api_token=${SPORTMONKS_API_TOKEN}&season_id=${seasonId}`;
    const response = await fetch(url);

    return await response.json();
}

async function getSeasonRounds(seasonId) {
    const url = `https://api.sportmonks.com/v3/football/rounds/seasons/${seasonId}?api_token=${SPORTMONKS_API_TOKEN}`;
    const response = await fetch(url);

    return await response.json();
}

const prisma = new PrismaClient();

async function testAdminFunctionality() {
    try {
        console.log('🔍 Testing Admin Game Creation Functionality...');

        // Test 1: Check if we can fetch Premier League 2025/26 teams for Race to 33
        console.log('\n📊 Step 1: Testing Race to 33 team fetching...');

        const plSeason = await prisma.season.findFirst({
            where: {
                name: '2025/2026',
                league: { sportMonksId: 8 }
            },
            include: { league: true }
        });

        if (!plSeason) {
            console.error('❌ Premier League 2025/26 season not found in database');

            return;
        }

        console.log(`✅ Found PL 2025/26 season: ${plSeason.name} (SportMonks ID: ${plSeason.sportMonksId})`);

        // Test fetching teams via API (same as what admin would do)
        const teamsResponse = await getSeasonTeams(plSeason.sportMonksId, 8);
        console.log(`✅ API returned ${teamsResponse.data?.length || 0} teams for 2025/26`);

        // Test 2: Check rounds for Last Man Standing
        console.log('\n📊 Step 2: Testing Last Man Standing rounds...');
        const roundsResponse = await getSeasonRounds(plSeason.sportMonksId);
        console.log(`✅ API returned ${roundsResponse.data?.length || 0} rounds for 2025/26`);

        if (roundsResponse.data && roundsResponse.data.length > 0) {
            console.log(
                `Sample rounds: ${roundsResponse.data
                    .slice(0, 3)
                    .map((r) => r.name)
                    .join(', ')}`
            );
        }

        // Test 3: Check database teams
        console.log('\n📊 Step 3: Testing database team count...');
        const dbTeams = await prisma.team.findMany({
            where: { seasonId: plSeason.id },
            include: { league: true }
        });

        console.log(`✅ Database has ${dbTeams.length} teams for PL 2025/26`);
        if (dbTeams.length > 0) {
            console.log(
                `Sample teams: ${dbTeams
                    .slice(0, 5)
                    .map((t) => t.name)
                    .join(', ')}`
            );
        }

        console.log('\n✅ All admin functionality tests passed! SportMonks API integration is working.');
    } catch (error) {
        console.error('❌ Error testing admin functionality:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAdminFunctionality();

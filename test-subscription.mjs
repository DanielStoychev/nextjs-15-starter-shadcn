import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple direct API test
async function testSportMonksSubscription() {
    try {
        const SPORTMONKS_API_TOKEN = '503hWIMnq1b6bJIG9XsXi9LDOnNGIWRurKjvZGDrD8n7xidH9n9xqUgCBzM2';

        console.log('🔍 Testing SportMonks API Subscription Details...');
        console.log('API Token:', SPORTMONKS_API_TOKEN);

        // Test 1: Get subscription info by making any API call
        console.log('\n📊 Testing API call to get subscription details...');
        const testUrl = `https://api.sportmonks.com/v3/football/leagues?api_token=${SPORTMONKS_API_TOKEN}`;

        const response = await fetch(testUrl);
        const data = await response.json();

        console.log('Response Status:', response.status);
        console.log('Subscription Details:', JSON.stringify(data.subscription, null, 2));
        console.log('Rate Limit:', JSON.stringify(data.rate_limit, null, 2));

        // Test 2: Try to access Premier League specifically
        console.log('\n⚽ Testing Premier League access...');
        const plUrl = `https://api.sportmonks.com/v3/football/leagues/8?api_token=${SPORTMONKS_API_TOKEN}`;

        const plResponse = await fetch(plUrl);
        const plData = await plResponse.json();

        console.log('Premier League Response Status:', plResponse.status);
        console.log('Premier League Data:', JSON.stringify(plData, null, 2));

        // Test 3: Check what leagues we actually have access to
        console.log('\n📋 Checking available leagues...');
        const leaguesUrl = `https://api.sportmonks.com/v3/football/leagues?api_token=${SPORTMONKS_API_TOKEN}`;

        const leaguesResponse = await fetch(leaguesUrl);
        const leaguesData = await leaguesResponse.json();

        console.log('Available leagues count:', leaguesData.data?.length || 0);
        if (leaguesData.data) {
            console.log('Sample leagues:');
            leaguesData.data.slice(0, 10).forEach((league) => {
                console.log(`  - ${league.name} (ID: ${league.id}) - Country: ${league.country_id}`);
            });
        }
    } catch (error) {
        console.error('❌ Error testing API:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSportMonksSubscription().catch(console.error);

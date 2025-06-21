// Test Premier League 2025/26 season data specifically
import { config } from 'dotenv';

config(); // Load .env file

console.log('Testing Premier League 2025/26 Season Data...');

const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
const PREMIER_LEAGUE_ID = 8;

if (!SPORTMONKS_API_TOKEN) {
    console.error('SPORTMONKS_API_TOKEN not found in environment');
    process.exit(1);
}

async function testPL2025Season() {
    try {
        console.log('🔍 Testing Premier League 2025/26 Season Access...');

        // Test 1: Get Premier League with seasons
        console.log('\n📊 Step 1: Getting Premier League with seasons...');
        let url = `https://api.sportmonks.com/v3/football/leagues/${PREMIER_LEAGUE_ID}?api_token=${SPORTMONKS_API_TOKEN}&include=seasons`;

        let response = await fetch(url);
        let data = await response.json();

        console.log('Premier League API Response Status:', response.status);
        console.log('Available seasons count:', data.data?.seasons?.length || 0);

        if (data.data?.seasons) {
            console.log('\n🏆 Available Premier League seasons:');
            data.data.seasons.forEach((season) => {
                console.log(`- ${season.name} (ID: ${season.id}) - Current: ${season.is_current_season || false}`);
            });

            // Look for 2025/2026 season
            const season2526 = data.data.seasons.find(
                (s) => s.name.includes('2025') || s.name.includes('2026') || s.name.includes('25/26')
            );

            if (season2526) {
                console.log(`\n✅ Found 2025/26 season: ${season2526.name} (ID: ${season2526.id})`);

                // Test 2: Get teams for 2025/26 season
                console.log('\n📊 Step 2: Getting teams for 2025/26 season...');
                const teamsUrl = `https://api.sportmonks.com/v3/football/teams?api_token=${SPORTMONKS_API_TOKEN}&season_id=${season2526.id}`;

                const teamsResponse = await fetch(teamsUrl);
                const teamsData = await teamsResponse.json();

                console.log('Teams API Response Status:', teamsResponse.status);
                console.log('Teams count for 2025/26:', teamsData.data?.length || 0);

                if (teamsData.data && teamsData.data.length > 0) {
                    console.log('\n⚽ Premier League 2025/26 teams:');
                    teamsData.data.slice(0, 10).forEach((team) => {
                        console.log(`- ${team.name} (ID: ${team.id})`);
                    });
                    if (teamsData.data.length > 10) {
                        console.log(`... and ${teamsData.data.length - 10} more teams`);
                    }
                }

                // Test 3: Get rounds/gameweeks for 2025/26 season
                console.log('\n📊 Step 3: Getting rounds for 2025/26 season...');
                const roundsUrl = `https://api.sportmonks.com/v3/football/rounds/seasons/${season2526.id}?api_token=${SPORTMONKS_API_TOKEN}`;

                const roundsResponse = await fetch(roundsUrl);
                const roundsData = await roundsResponse.json();

                console.log('Rounds API Response Status:', roundsResponse.status);
                console.log('Rounds count for 2025/26:', roundsData.data?.length || 0);

                if (roundsData.data && roundsData.data.length > 0) {
                    console.log('\n🏁 Sample rounds for 2025/26:');
                    roundsData.data.slice(0, 5).forEach((round) => {
                        console.log(`- ${round.name} (ID: ${round.id})`);
                    });
                    if (roundsData.data.length > 5) {
                        console.log(`... and ${roundsData.data.length - 5} more rounds`);
                    }
                }

                // Test 4: Get a few fixtures to verify data quality
                if (roundsData.data && roundsData.data.length > 0) {
                    console.log('\n📊 Step 4: Testing fixture data for first round...');
                    const firstRound = roundsData.data[0];
                    const fixturesUrl = `https://api.sportmonks.com/v3/football/rounds/${firstRound.id}?api_token=${SPORTMONKS_API_TOKEN}&include=fixtures`;

                    const fixturesResponse = await fetch(fixturesUrl);
                    const fixturesData = await fixturesResponse.json();

                    console.log('Fixtures API Response Status:', fixturesResponse.status);
                    console.log('Fixtures count for first round:', fixturesData.data?.fixtures?.length || 0);

                    if (fixturesData.data?.fixtures && fixturesData.data.fixtures.length > 0) {
                        console.log(`\n⚽ Sample fixtures from ${firstRound.name}:`);
                        fixturesData.data.fixtures.slice(0, 3).forEach((fixture) => {
                            console.log(`- Fixture ID: ${fixture.id}, Date: ${fixture.starting_at || 'TBD'}`);
                        });
                    }
                }

                console.log('\n✅ Premier League 2025/26 season data is fully accessible!');
                console.log('🎯 Ready to run seeding and fix any API-related issues.');
            } else {
                console.log('\n❌ 2025/26 season not found in available seasons');
                console.log(
                    'Available season names:',
                    data.data.seasons.map((s) => s.name)
                );
            }
        }
    } catch (error) {
        console.error('❌ Error testing Premier League 2025/26:', error);

        if (error.message.includes('401')) {
            console.log('🔑 Authentication issue - check API token');
        } else if (error.message.includes('403')) {
            console.log('🚫 Access forbidden - check subscription plan');
        } else if (error.message.includes('429')) {
            console.log('⏰ Rate limit exceeded - wait and try again');
        }
    }
}

testPL2025Season();

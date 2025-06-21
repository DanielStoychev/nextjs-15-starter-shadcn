// Simple test to check SportMonks API response
console.log('Testing SportMonks API call...');

const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
const PREMIER_LEAGUE_ID = 8;

if (!SPORTMONKS_API_TOKEN) {
    console.error('SPORTMONKS_API_TOKEN not found in environment');
    process.exit(1);
}

async function testSportMonksAPI() {
    try {
        // Test 1: Get all available leagues
        let url = `https://api.sportmonks.com/v3/football/leagues?api_token=${SPORTMONKS_API_TOKEN}`;
        console.log('Fetching all leagues URL:', url);

        let response = await fetch(url);
        let data = await response.json();

        console.log('All Leagues API Response Status:', response.status);
        console.log('Available leagues count:', data.data?.length || 0);

        if (data.data && Array.isArray(data.data)) {
            console.log('\n🏆 Available leagues:');
            data.data.slice(0, 20).forEach((league) => {
                console.log(`- ${league.name} (ID: ${league.id}) - Country: ${league.country_id}`);
            });

            // Look for Premier League or English leagues
            const englishLeagues = data.data.filter(
                (league) =>
                    league.name &&
                    (league.name.toLowerCase().includes('premier') ||
                        league.name.toLowerCase().includes('championship') ||
                        league.name.toLowerCase().includes('league one') ||
                        league.name.toLowerCase().includes('league two') ||
                        league.name.toLowerCase().includes('england'))
            );

            if (englishLeagues.length > 0) {
                console.log('\n🏴󠁧󠁢󠁥󠁮󠁧󠁿 English leagues found:');
                englishLeagues.forEach((league) => {
                    console.log(`- ${league.name} (ID: ${league.id})`);
                });
            } else {
                console.log('\n❌ No English leagues found in available data');
            }
        }

        // Test 2: Try specific Premier League ID
        console.log('\n\n--- Testing Premier League ID 8 ---');
        url = `https://api.sportmonks.com/v3/football/leagues/${PREMIER_LEAGUE_ID}?api_token=${SPORTMONKS_API_TOKEN}&include=currentSeason`;
        console.log('Fetching URL:', url);

        response = await fetch(url);
        data = await response.json();

        console.log('Premier League API Response Status:', response.status);
        console.log('Premier League API Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testSportMonksAPI();

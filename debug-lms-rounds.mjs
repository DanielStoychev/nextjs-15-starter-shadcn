impo// Import the SportMonks API functions (using tsx to handle TypeScript)
import { 
  getLeagueDetails, 
  getSeasonRounds, 
  getRoundFixtures 
} from './src/lib/sportmonks-api.ts';rismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Import the SportMonks API functions (using tsx to handle TypeScript)
import { 
  getLeagueDetails, 
  getSeasonRounds, 
  getRoundFixtures
} from './src/lib/sportmonks-api.ts';

const PREMIER_LEAGUE_ID = 8; // Premier League SportMonks ID

async function debugLMSRoundSelection() {
  try {
    console.log('🔍 Debugging LMS Round Selection...');
    console.log('Current date:', new Date().toISOString());
    
    // Get Premier League details
    console.log('\n📊 Fetching Premier League details...');
    const leagueDetailsResponse = await getLeagueDetails(PREMIER_LEAGUE_ID, 'currentSeason');
    const apiLeagueData = leagueDetailsResponse.data;
    
    console.log('League:', apiLeagueData?.name);
    console.log('Current Season:', apiLeagueData?.currentseason?.name);
    console.log('Season ID:', apiLeagueData?.currentseason?.id);
    console.log('Season finished:', apiLeagueData?.currentseason?.finished);
    console.log('Season is current:', apiLeagueData?.currentseason?.is_current);
    
    const currentSeasonData = apiLeagueData?.currentseason;
    if (!currentSeasonData) {
      console.log('❌ No current season found');
      return;
    }
    
    // Get rounds for the season
    console.log('\n🔄 Fetching season rounds...');
    const roundsResponse = await getSeasonRounds(currentSeasonData.id);
    const rounds = roundsResponse.data || [];
    
    console.log(`Found ${rounds.length} rounds:`);
    rounds.forEach((round, index) => {
      const startDate = new Date(round.starting_at);
      const endDate = new Date(round.ending_at);
      const now = new Date();
      
      console.log(`  ${index + 1}. ${round.name} (ID: ${round.id})`);
      console.log(`     Start: ${startDate.toISOString()}`);
      console.log(`     End: ${endDate.toISOString()}`);
      console.log(`     Started: ${startDate <= now ? 'Yes' : 'No'}`);
      console.log(`     Finished: ${endDate < now ? 'Yes' : 'No'}`);
    });
    
    // Apply the same logic as in the game page
    rounds.sort((a, b) => new Date(a.starting_at).getTime() - new Date(b.starting_at).getTime());
    const now = new Date();
    
    console.log('\n🎯 Applying round selection logic...');
    
    // First, try to find a round that hasn't ended yet (ongoing or upcoming)
    let targetRoundData = rounds.find((r) => new Date(r.ending_at) >= now) || null;
    console.log('Round that hasn\'t ended yet:', targetRoundData?.name || 'none');
    
    // If no ongoing/upcoming round found, but we have rounds, use the first round
    if (!targetRoundData && rounds.length > 0) {
      targetRoundData = rounds[0];
      console.log('Using first round of season:', targetRoundData.name);
    }
    
    // If still no round and we have rounds, use the last one as fallback
    if (!targetRoundData && rounds.length > 0) {
      targetRoundData = rounds[rounds.length - 1];
      console.log('Using last round as fallback:', targetRoundData.name);
    }
    
    console.log('\n✅ Selected round:', targetRoundData?.name || 'NONE');
    
    if (targetRoundData) {
      // Check if this round exists in our database
      console.log('\n🗄️ Checking database for round...');
      const dbRound = await prisma.round.findUnique({
        where: { sportMonksId: targetRoundData.id }
      });
      
      console.log('Round exists in DB:', dbRound ? 'Yes' : 'No');
      if (dbRound) {
        console.log('DB Round ID:', dbRound.id);
        console.log('DB Round name:', dbRound.name);
      }
      
      // Get fixtures for this round
      console.log('\n⚽ Fetching fixtures for selected round...');
      const roundFixturesResponse = await getRoundFixtures(targetRoundData.id);
      const initialFixturesData = roundFixturesResponse.data?.fixtures?.data || 
                                  roundFixturesResponse.data?.fixtures || [];
      
      console.log(`Found ${initialFixturesData.length} fixtures`);
      
      if (initialFixturesData.length > 0) {
        console.log('Sample fixtures:');
        initialFixturesData.slice(0, 3).forEach((fixture, index) => {
          console.log(`  ${index + 1}. Fixture ID: ${fixture.id}, Date: ${fixture.starting_at}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error in debug script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLMSRoundSelection().catch(console.error);

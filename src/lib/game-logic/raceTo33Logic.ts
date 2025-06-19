import prisma from '@/lib/prisma';

// Define SportMonks IDs for the relevant English leagues
// These should be verified against your SportMonks data or fetched dynamically if needed.
const PREMIER_LEAGUE_SM_ID = 8;
const CHAMPIONSHIP_SM_ID = 9;
const LEAGUE_ONE_SM_ID = 12;
const LEAGUE_TWO_SM_ID = 14;

const TARGET_LEAGUE_SPORTMONKS_IDS = [PREMIER_LEAGUE_SM_ID, CHAMPIONSHIP_SM_ID, LEAGUE_ONE_SM_ID, LEAGUE_TWO_SM_ID];

export async function assignTeamsToUser(gameInstanceId: string): Promise<string[]> {
    console.log(`Attempting to assign teams for gameInstanceId: ${gameInstanceId}`);
    const assignedTeamSportMonksIds: string[] = [];

    try {
        for (const leagueSportMonksId of TARGET_LEAGUE_SPORTMONKS_IDS) {
            console.log(`[assignTeamsToUser] Processing leagueSportMonksId: ${leagueSportMonksId}`);
            const queryConditions = {
                league: {
                    sportMonksId: leagueSportMonksId
                }
            };
            console.log(`[assignTeamsToUser] Querying teams with conditions: ${JSON.stringify(queryConditions)}`);

            const teamsInLeague = await prisma.team.findMany({
                where: queryConditions,
                select: {
                    sportMonksId: true, // Select the SportMonks ID
                    name: true // Also log name for easier debugging
                }
            });

            console.log(
                `[assignTeamsToUser] Found ${teamsInLeague ? teamsInLeague.length : 'null'} teams for league ID ${leagueSportMonksId}:`,
                teamsInLeague
            );

            if (!teamsInLeague || teamsInLeague.length === 0) {
                console.error(
                    `[assignTeamsToUser] No teams found for league SportMonks ID ${leagueSportMonksId} in gameInstanceId ${gameInstanceId}.`
                );
                // Handle this error appropriately - perhaps throw an error or return empty
                // For Race to 33, all 4 leagues are essential.
                throw new Error(`Could not find teams for league ID ${leagueSportMonksId}.`);
            }

            // Randomly select one team from this league
            const randomIndex = Math.floor(Math.random() * teamsInLeague.length);
            const selectedTeam = teamsInLeague[randomIndex];
            assignedTeamSportMonksIds.push(String(selectedTeam.sportMonksId));
        }

        if (assignedTeamSportMonksIds.length !== TARGET_LEAGUE_SPORTMONKS_IDS.length) {
            console.error(
                `Failed to assign a team from each required league for gameInstanceId ${gameInstanceId}. Expected ${TARGET_LEAGUE_SPORTMONKS_IDS.length} teams, got ${assignedTeamSportMonksIds.length}.`
            );
            throw new Error('Could not assign a complete set of 4 teams.');
        }

        // Optional: Check if this exact set of 4 teams has already been assigned in this gameInstanceId
        // This would require querying RaceTo33Assignment table and potentially re-rolling if a duplicate set is found.
        // For now, focusing on individual random assignment per user.

        console.log(
            `Successfully assigned SportMonks IDs for gameInstanceId ${gameInstanceId}: ${assignedTeamSportMonksIds.join(', ')}`
        );

        return assignedTeamSportMonksIds;
    } catch (error: any) {
        console.error(`Error in assignTeamsToUser for gameInstanceId ${gameInstanceId}:`, error.message);
        // Propagate the error or return an empty array to indicate failure
        throw error; // Or return []; based on how the calling API route handles it
    }
}

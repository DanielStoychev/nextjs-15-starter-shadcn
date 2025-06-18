import prisma from '@/lib/prisma';

export async function assignTeamsToUser(gameInstanceId: string): Promise<string[]> {
    // TODO: Implement actual team assignment logic based on game rules.
    console.log(`Attempting to assign teams for gameInstanceId: ${gameInstanceId}`);

    const targetSportMonksIds = [1, 2, 3, 4]; // The IDs we expect to be seeded

    const existingTeams = await prisma.team.findMany({
        where: {
            sportMonksId: {
                in: targetSportMonksIds
            }
        },
        select: {
            sportMonksId: true
        }
    });

    const foundSportMonksIds = existingTeams.map((team) => team.sportMonksId);

    if (foundSportMonksIds.length < targetSportMonksIds.length) {
        console.error(
            `Could not find all required teams in the database. Expected IDs: ${targetSportMonksIds.join(', ')}. Found IDs: ${foundSportMonksIds.join(', ')}. Please check seed data.`
        );
        // Depending on desired behavior, you might throw an error or return fewer/different teams.
        // For now, let's return only the IDs that were found, converted to strings.
        return foundSportMonksIds.map((id) => String(id));
    }

    // All target teams found, return their IDs as strings
    const assignedTeamIds = foundSportMonksIds.map((id) => String(id));
    console.log(`Successfully found and will assign SportMonks IDs: ${assignedTeamIds.join(', ')}`);

    return assignedTeamIds;
}

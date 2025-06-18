import prisma from '@/lib/prisma';
import { UserGameEntryStatus } from '@prisma/client';

export async function processRaceTo33Goals(gameInstanceId: string) {
    console.log(`Processing Race to 33 goals for game instance: ${gameInstanceId}`);

    // 1. Fetch all active RaceTo33Assignment entries for this game instance
    const activeAssignments = await prisma.raceTo33Assignment.findMany({
        where: {
            userGameEntry: {
                gameInstanceId: gameInstanceId,
                status: UserGameEntryStatus.ACTIVE
            }
        },
        include: {
            userGameEntry: true
        }
    });

    if (activeAssignments.length === 0) {
        console.log('No active Race to 33 assignments found for this game instance.');

        return { updatedCount: 0, completedCount: 0, bustCount: 0 };
    }

    let updatedCount = 0;
    let completedCount = 0;
    let bustCount = 0;

    for (const assignment of activeAssignments) {
        const { id: assignmentId, assignedTeamIds, cumulativeGoals } = assignment;
        let newCumulativeGoals = cumulativeGoals;

        // TODO: Implement actual logic to fetch recent fixture results for assigned teams
        // For now, simulate goal updates.
        // In a real scenario, you would:
        // 1. Get the current round/fixtures relevant to the game instance's timeframe.
        // 2. Fetch results for fixtures involving `assignedTeamIds`.
        // 3. Sum up goals scored by `assignedTeamIds` in those fixtures.

        // Dummy goal update logic: Add a random number of goals (0-3) for each team
        for (const teamId of assignedTeamIds) {
            const goalsScored = Math.floor(Math.random() * 4); // Simulate 0-3 goals
            newCumulativeGoals += goalsScored;
            console.log(`Team ${teamId} scored ${goalsScored} goals. New cumulative: ${newCumulativeGoals}`);
        }

        // Check for win/bust conditions
        let newStatus: UserGameEntryStatus = UserGameEntryStatus.ACTIVE;
        if (newCumulativeGoals === 33) {
            newStatus = UserGameEntryStatus.COMPLETED;
            completedCount++;
            console.log(`User ${assignment.userGameEntry.userId} reached exactly 33 goals!`);
        } else if (newCumulativeGoals > 33) {
            newStatus = UserGameEntryStatus.BUST;
            bustCount++;
            console.log(`User ${assignment.userGameEntry.userId} exceeded 33 goals and is BUST!`);
        }

        // Update the assignment and user game entry status
        await prisma.$transaction([
            prisma.raceTo33Assignment.update({
                where: { id: assignmentId },
                data: { cumulativeGoals: newCumulativeGoals }
            }),
            prisma.userGameEntry.update({
                where: { id: assignment.userGameEntry.id },
                data: { status: newStatus }
            })
        ]);

        updatedCount++;
    }

    console.log(`Finished processing Race to 33 goals for game instance ${gameInstanceId}.`);

    return { updatedCount, completedCount, bustCount };
}

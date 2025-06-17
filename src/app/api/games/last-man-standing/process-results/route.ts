import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        // For now, we'll hardcode the round ID to the dummy one we're using
        const dummyRoundId = 'cmc0kzbgu0008lojo8utb6pzd'; // Replace with the actual dummy round ID from your db:check output

        // 1. Fetch all LastManStandingPick entries for the current round
        const picks = await prisma.lastManStandingPick.findMany({
            where: {
                roundId: dummyRoundId,
                userGameEntry: {
                    status: 'ACTIVE' // Only process picks from active users
                }
            },
            include: {
                userGameEntry: true // Include user game entry to update status
            }
        });

        if (picks.length === 0) {
            return NextResponse.json({ message: 'No active picks found for this round.' }, { status: 200 });
        }

        // 2. Simulate fixture results (for demonstration purposes)
        // In a real scenario, this would involve fetching actual fixture results from SportMonks
        // For now, let's assume a simple rule: pickedTeamId 1 (Arsenal) wins, others lose.
        const winningTeamId = 1; // Arsenal

        for (const pick of picks) {
            let isCorrect = false;
            if (pick.pickedTeamId === String(winningTeamId)) {
                isCorrect = true;
            }

            // Update the pick status
            await prisma.lastManStandingPick.update({
                where: { id: pick.id },
                data: { isCorrect: isCorrect }
            });

            // If pick is incorrect, eliminate the user
            if (!isCorrect) {
                await prisma.userGameEntry.update({
                    where: { id: pick.userGameEntry.id },
                    data: { status: 'ELIMINATED' }
                });
            }
        }

        // 3. Check for rollovers (all active players eliminated)
        const remainingActiveUsers = await prisma.userGameEntry.count({
            where: {
                gameInstanceId: picks[0].userGameEntry.gameInstanceId,
                status: 'ACTIVE'
            }
        });

        if (remainingActiveUsers === 0) {
            // All players eliminated, handle rollover (e.g., update prize pool, reset game instance)
            // For now, just log a message
            console.log('All players eliminated! Rollover triggered.');
            // In a real app, you'd update the gameInstance prizePool and potentially create a new instance
        }

        return NextResponse.json({ message: 'Last Man Standing results processed successfully.' }, { status: 200 });
    } catch (error) {
        console.error('Error processing Last Man Standing results:', error);

        return NextResponse.json(
            { message: 'Failed to process Last Man Standing results', details: (error as Error).message },
            { status: 500 }
        );
    }
}

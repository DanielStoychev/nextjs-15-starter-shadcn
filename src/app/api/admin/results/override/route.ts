import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userGameEntryId, overrideData, reason } = await request.json();

        if (!userGameEntryId || !overrideData || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields: userGameEntryId, overrideData, reason' },
                { status: 400 }
            );
        }

        // Get current user game entry
        const userGameEntry = await prisma.userGameEntry.findUnique({
            where: { id: userGameEntryId },
            include: {
                user: { select: { name: true, email: true } },
                gameInstance: {
                    include: {
                        game: { select: { name: true, slug: true } }
                    }
                }
            }
        });

        if (!userGameEntry) {
            return NextResponse.json({ error: 'User game entry not found' }, { status: 404 });
        }

        // Store original values for audit trail
        const originalData = {
            status: userGameEntry.status,
            currentScore: userGameEntry.currentScore
        };

        // Apply override
        const updatedEntry = await prisma.userGameEntry.update({
            where: { id: userGameEntryId },
            data: {
                ...(overrideData.status && { status: overrideData.status }),
                ...(overrideData.currentScore !== undefined && { currentScore: overrideData.currentScore }),
                updatedAt: new Date()
            }
        });

        // TODO: Create audit log entry when Prisma client is updated
        console.log('Admin override action:', {
            adminId: session.user.id,
            action: 'ADMIN_OVERRIDE',
            entityType: 'USER_GAME_ENTRY',
            entityId: userGameEntryId,
            details: {
                userGameEntryId,
                userId: userGameEntry.userId,
                gameInstanceId: userGameEntry.gameInstanceId,
                gameName: userGameEntry.gameInstance.game.name,
                userName: userGameEntry.user.name || userGameEntry.user.email,
                originalData,
                overrideData,
                reason
            }
        });

        return NextResponse.json({
            success: true,
            userGameEntry: updatedEntry,
            message: `Successfully applied admin override to ${userGameEntry.user.name || userGameEntry.user.email}'s entry in ${userGameEntry.gameInstance.game.name}`
        });
    } catch (error) {
        console.error('Admin override error:', error);

        return NextResponse.json({ error: 'Failed to apply admin override' }, { status: 500 });
    }
}

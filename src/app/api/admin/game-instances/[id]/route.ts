import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const { status } = await request.json();

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
                { status: 400 }
            );
        }

        // Check if game instance exists
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { id },
            include: {
                game: { select: { name: true, slug: true } }
            }
        });

        if (!gameInstance) {
            return NextResponse.json({ error: 'Game instance not found' }, { status: 404 });
        }

        // Update the game instance status
        const updatedInstance = await prisma.gameInstance.update({
            where: { id },
            data: { status }
        });

        // Log the action (TODO: create audit log when Prisma client supports it)
        console.log('Status change audit log:', {
            adminId: session.user!.id,
            action: 'STATUS_CHANGE',
            entityType: 'GAME_INSTANCE',
            entityId: id,
            details: {
                gameInstanceId: id,
                gameName: gameInstance.game.name,
                oldStatus: gameInstance.status,
                newStatus: status
            }
        });

        return NextResponse.json({
            success: true,
            gameInstance: updatedInstance,
            message: `Game instance status updated to ${status}`
        });
    } catch (error) {
        console.error('Status update error:', error);

        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}

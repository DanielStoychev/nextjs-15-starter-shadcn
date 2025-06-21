import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, instanceIds } = await request.json();

        if (!action || !instanceIds || !Array.isArray(instanceIds) || instanceIds.length === 0) {
            return NextResponse.json({ error: 'Missing required fields: action, instanceIds' }, { status: 400 });
        }

        const validActions = ['activate', 'complete', 'cancel', 'archive', 'delete'];
        if (!validActions.includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Must be one of: ' + validActions.join(', ') },
                { status: 400 }
            );
        }

        let result;
        let updateData: any = {};

        switch (action) {
            case 'activate':
                updateData = { status: 'ACTIVE' };
                break;
            case 'complete':
                updateData = { status: 'COMPLETED' };
                break;
            case 'cancel':
                updateData = { status: 'CANCELLED' };
                break;
            case 'archive':
                updateData = { status: 'ARCHIVED' };
                break;
            case 'delete':
                // For delete, we actually delete the records
                result = await prisma.gameInstance.deleteMany({
                    where: {
                        id: {
                            in: instanceIds
                        }
                    }
                });
                break;
            default:
                return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
        }

        if (action !== 'delete') {
            // For status updates
            result = await prisma.gameInstance.updateMany({
                where: {
                    id: {
                        in: instanceIds
                    }
                },
                data: updateData
            });
        } // Create audit log entries for batch operation
        const auditLogEntries = instanceIds.map((instanceId) => ({
            adminId: session.user!.id,
            action: `BATCH_${action.toUpperCase()}`,
            entityType: 'GAME_INSTANCE',
            entityId: instanceId,
            details: {
                batchAction: action,
                totalAffected: instanceIds.length,
                instanceIds: instanceIds
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        }));

        // Note: This will work once the Prisma client is regenerated with AdminAuditLog
        // For now, just log the action
        console.log('Batch operation audit log:', auditLogEntries);

        return NextResponse.json({
            success: true,
            action,
            affected: result?.count || instanceIds.length,
            message: `Successfully ${action}${action.endsWith('e') ? 'd' : 'ed'} ${result?.count || instanceIds.length} game instance(s)`
        });
    } catch (error) {
        console.error('Batch operation error:', error);

        return NextResponse.json({ error: 'Failed to execute batch operation' }, { status: 500 });
    }
}

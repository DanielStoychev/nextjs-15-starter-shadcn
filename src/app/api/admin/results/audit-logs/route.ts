import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const action = searchParams.get('action');
        const entityType = searchParams.get('entityType');
        const adminId = searchParams.get('adminId');

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};
        if (action) where.action = action;
        if (entityType) where.entityType = entityType;
        if (adminId) where.adminId = adminId;

        // For now, return a mock structure since AdminAuditLog model needs Prisma client regeneration
        // TODO: Replace with actual audit log queries when Prisma client is updated

        const mockAuditLogs = [
            {
                id: 'mock-1',
                adminId: session.user.id,
                action: 'MANUAL_RESULT_PROCESSING',
                entityType: 'FIXTURE',
                entityId: 'fixture-123',
                details: {
                    gameInstanceId: 'game-instance-123',
                    fixtureId: 'fixture-123',
                    results: { homeScore: 2, awayScore: 1 },
                    processedEntries: 15,
                    homeTeam: 'Arsenal',
                    awayTeam: 'Chelsea'
                },
                ipAddress: '127.0.0.1',
                createdAt: new Date().toISOString(),
                admin: {
                    name: 'Admin User',
                    email: 'admin@footygames.co.uk'
                }
            }
        ];

        // Get total count for pagination
        const total = mockAuditLogs.length;

        return NextResponse.json({
            auditLogs: mockAuditLogs.slice(skip, skip + limit),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Audit logs fetch error:', error);

        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}

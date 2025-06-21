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
        const type = searchParams.get('type');
        const action = searchParams.get('action');
        const entityType = searchParams.get('entityType');
        const adminId = searchParams.get('adminId');

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};
        if (action) where.action = action;
        if (entityType) where.entityType = entityType;
        if (adminId) where.adminId = adminId;

        // Filter by results-related actions if type=results
        if (type === 'results') {
            where.action = {
                in: ['MANUAL_RESULT_PROCESSING', 'ADMIN_OVERRIDE', 'RESULT_CORRECTION']
            };
        }

        // For now, return mock data since AdminAuditLog model needs Prisma client regeneration
        // TODO: Replace with actual audit log queries when Prisma client is updated

        const mockAuditLogs = [
            {
                id: 'audit-1',
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
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                admin: {
                    name: session.user.name || 'Admin User',
                    email: session.user.email || 'admin@footygames.co.uk'
                }
            },
            {
                id: 'audit-2',
                adminId: session.user.id,
                action: 'ADMIN_OVERRIDE',
                entityType: 'USER_GAME_ENTRY',
                entityId: 'entry-456',
                details: {
                    userGameEntryId: 'entry-456',
                    userId: 'user-789',
                    gameInstanceId: 'game-instance-123',
                    gameName: 'Weekly Score Predictor - Week 15',
                    userName: 'John Doe',
                    originalData: { status: 'ACTIVE', currentScore: 5 },
                    overrideData: { currentScore: 8 },
                    reason: 'Manual correction due to scoring dispute'
                },
                ipAddress: '127.0.0.1',
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                admin: {
                    name: session.user.name || 'Admin User',
                    email: session.user.email || 'admin@footygames.co.uk'
                }
            },
            {
                id: 'audit-3',
                adminId: session.user.id,
                action: 'MANUAL_RESULT_PROCESSING',
                entityType: 'FIXTURE',
                entityId: 'fixture-789',
                details: {
                    gameInstanceId: 'game-instance-456',
                    fixtureId: 'fixture-789',
                    results: { homeScore: 0, awayScore: 3 },
                    processedEntries: 8,
                    homeTeam: 'Manchester United',
                    awayTeam: 'Liverpool'
                },
                ipAddress: '127.0.0.1',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                admin: {
                    name: session.user.name || 'Admin User',
                    email: session.user.email || 'admin@footygames.co.uk'
                }
            }
        ];

        // Filter mock data based on query parameters
        let filteredLogs = mockAuditLogs;

        if (type === 'results') {
            filteredLogs = mockAuditLogs.filter((log) =>
                ['MANUAL_RESULT_PROCESSING', 'ADMIN_OVERRIDE', 'RESULT_CORRECTION'].includes(log.action)
            );
        }

        if (action) {
            filteredLogs = filteredLogs.filter((log) => log.action === action);
        }

        if (entityType) {
            filteredLogs = filteredLogs.filter((log) => log.entityType === entityType);
        }

        // Get total count for pagination
        const total = filteredLogs.length;

        return NextResponse.json({
            auditLogs: filteredLogs.slice(skip, skip + limit),
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

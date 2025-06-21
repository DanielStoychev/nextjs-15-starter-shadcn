import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

// GET - Fetch user notifications (temporary mock implementation)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Temporary mock data while we fix Prisma client
        const mockNotifications = [
            {
                id: '1',
                type: 'SUCCESS',
                title: 'Welcome to FootyGames!',
                message: 'Your account has been created successfully. Ready to test your football knowledge?',
                read: false,
                priority: 'MEDIUM',
                actionUrl: '/games',
                actionText: 'Explore Games',
                createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
            },
            {
                id: '2',
                type: 'GAME',
                title: 'Premier League Predictions Open',
                message: 'Gameweek 15 predictions are now open for entry',
                read: false,
                priority: 'MEDIUM',
                actionUrl: '/games/premier-league/15',
                actionText: 'Enter Now',
                createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
            },
            {
                id: '3',
                type: 'WARNING',
                title: 'Deadline Approaching',
                message: '2 hours left to submit your predictions for Arsenal vs Chelsea',
                read: true,
                priority: 'HIGH',
                actionUrl: '/games/premier-league/current',
                actionText: 'Submit Now',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
            }
        ];

        const unreadCount = mockNotifications.filter((n) => !n.read).length;

        return NextResponse.json({
            notifications: mockNotifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);

        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// PATCH - Mark notifications as read (temporary mock implementation)
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, notificationId } = body;

        if (action === 'markAsRead' && notificationId) {
            // Mock implementation - just return success
            return NextResponse.json({ success: true });
        }

        if (action === 'markAllAsRead') {
            // Mock implementation - just return success
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error updating notifications:', error);

        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}

// POST - Create notification (temporary mock implementation)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        // Check if user is admin (you may need to adjust this based on your user model)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            userId,
            userIds,
            type,
            title,
            message,
            priority = 'MEDIUM',
            actionUrl,
            actionText,
            sendToAll = false
        } = body;

        // Validate required fields
        if (!type || !title || !message) {
            return NextResponse.json({ error: 'Missing required fields: type, title, message' }, { status: 400 });
        }

        // Mock implementation - just return success with count
        let count = 1;
        if (sendToAll) {
            count = 100; // Mock all users count
        } else if (userIds && Array.isArray(userIds)) {
            count = userIds.length;
        }

        return NextResponse.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error creating notification:', error);

        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}

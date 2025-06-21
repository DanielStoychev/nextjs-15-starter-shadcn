import { NextRequest, NextResponse } from 'next/server';

import { NotificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
    try {
        // Check for API key authentication (for cron jobs)
        const apiKey = request.headers.get('X-API-KEY');

        if (process.env.CRON_SECRET && apiKey !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Run all notification checks
        await NotificationService.runNotificationChecks();

        return NextResponse.json({
            success: true,
            message: 'Notification checks completed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error running notification checks:', error);

        return NextResponse.json(
            {
                error: 'Failed to run notification checks',
                details: (error as Error).message
            },
            { status: 500 }
        );
    }
}

// Also allow GET for manual testing
export async function GET() {
    return NextResponse.json({
        message: 'Notification check endpoint is active. Use POST to run checks.',
        timestamp: new Date().toISOString()
    });
}

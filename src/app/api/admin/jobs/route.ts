/**
 * Job Management API
 * Allows manual triggering and monitoring of scheduled jobs
 */
import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import { jobScheduler } from '@/lib/scheduler';

import { getServerSession } from 'next-auth';

export async function GET() {
    try {
        // Check admin authentication
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get job status
        const jobStatus = jobScheduler.getJobStatus();

        return NextResponse.json({
            status: 'success',
            jobs: jobStatus
        });
    } catch (error) {
        console.error('Error getting job status:', error);

        return NextResponse.json({ error: 'Failed to get job status' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Check admin authentication
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, jobName } = body;

        switch (action) {
            case 'start':
                await jobScheduler.start();

                return NextResponse.json({
                    status: 'success',
                    message: 'Job scheduler started'
                });

            case 'stop':
                await jobScheduler.stop();

                return NextResponse.json({
                    status: 'success',
                    message: 'Job scheduler stopped'
                });

            case 'run':
                if (!jobName) {
                    return NextResponse.json({ error: 'Job name is required for run action' }, { status: 400 });
                }
                await jobScheduler.runJob(jobName);

                return NextResponse.json({
                    status: 'success',
                    message: `Job ${jobName} executed successfully`
                });

            default:
                return NextResponse.json({ error: 'Invalid action. Use: start, stop, or run' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error managing jobs:', error);

        return NextResponse.json(
            { error: 'Failed to manage jobs', details: (error as Error).message },
            { status: 500 }
        );
    }
}

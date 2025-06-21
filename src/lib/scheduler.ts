/**
 * Job Scheduler for FootyGames.co.uk
 * Handles automated fixture fetching, result processing, and game updates
 */
import { PrismaClient } from '@prisma/client';

import { cleanupJob } from './jobs/cleanup-job';
import { fixtureUpdateJob } from './jobs/fixture-update-job';
import { gameInstanceStatusJob } from './jobs/game-instance-status-job';
import { resultProcessingJob } from './jobs/result-processing-job';
import { runNotificationChecks } from './notification-service';
import * as cron from 'node-cron';

const prisma = new PrismaClient();

interface JobConfig {
    name: string;
    schedule: string;
    job: () => Promise<void>;
    enabled: boolean;
}

// Job configurations
const jobs: JobConfig[] = [
    {
        name: 'Fixture Update',
        schedule: '0 */6 * * *', // Every 6 hours
        job: fixtureUpdateJob,
        enabled: true
    },
    {
        name: 'Result Processing',
        schedule: '0 */2 * * *', // Every 2 hours
        job: resultProcessingJob,
        enabled: true
    },
    {
        name: 'Game Instance Status Check',
        schedule: '0 */1 * * *', // Every hour
        job: gameInstanceStatusJob,
        enabled: true
    },
    {
        name: 'Notification Check',
        schedule: '*/30 * * * *', // Every 30 minutes
        job: runNotificationChecks,
        enabled: true
    },
    {
        name: 'Cleanup Job',
        schedule: '0 2 * * *', // Daily at 2 AM
        job: cleanupJob,
        enabled: true
    }
];

class JobScheduler {
    private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

    /**
     * Initialize and start all enabled jobs
     */
    public async start(): Promise<void> {
        console.log('🚀 Starting Job Scheduler...');

        for (const jobConfig of jobs) {
            if (jobConfig.enabled) {
                await this.scheduleJob(jobConfig);
            }
        }

        console.log(`✅ Job Scheduler started with ${this.scheduledJobs.size} active jobs`);
    }

    /**
     * Schedule a single job
     */
    private async scheduleJob(jobConfig: JobConfig): Promise<void> {
        try {
            const task = cron.schedule(
                jobConfig.schedule,
                async () => {
                    const startTime = Date.now();
                    console.log(`🔄 Starting job: ${jobConfig.name}`);

                    try {
                        await jobConfig.job();
                        const duration = Date.now() - startTime;
                        console.log(`✅ Job completed: ${jobConfig.name} (${duration}ms)`);
                    } catch (error) {
                        console.error(`❌ Job failed: ${jobConfig.name}`, error);

                        // Log job failure to database for monitoring
                        await this.logJobFailure(jobConfig.name, error as Error);
                    }
                },
                {
                    timezone: 'Europe/London' // UK timezone
                }
            );

            this.scheduledJobs.set(jobConfig.name, task);
            task.start();

            console.log(`📅 Scheduled job: ${jobConfig.name} (${jobConfig.schedule})`);
        } catch (error) {
            console.error(`Failed to schedule job: ${jobConfig.name}`, error);
        }
    }

    /**
     * Stop all scheduled jobs
     */
    public async stop(): Promise<void> {
        console.log('🛑 Stopping Job Scheduler...');

        for (const [name, task] of this.scheduledJobs) {
            task.destroy();
            console.log(`Stopped job: ${name}`);
        }

        this.scheduledJobs.clear();
        await prisma.$disconnect();
        console.log('✅ Job Scheduler stopped');
    }

    /**
     * Run a specific job immediately
     */
    public async runJob(jobName: string): Promise<void> {
        const job = jobs.find((j) => j.name === jobName);
        if (!job) {
            throw new Error(`Job not found: ${jobName}`);
        }

        console.log(`🔄 Running job immediately: ${jobName}`);
        await job.job();
        console.log(`✅ Job completed: ${jobName}`);
    }

    /**
     * Get job status information
     */
    public getJobStatus(): Array<{ name: string; enabled: boolean; schedule: string; running: boolean }> {
        return jobs.map((job) => ({
            name: job.name,
            enabled: job.enabled,
            schedule: job.schedule,
            running: this.scheduledJobs.has(job.name)
        }));
    }

    /**
     * Log job failures for monitoring
     */
    private async logJobFailure(jobName: string, error: Error): Promise<void> {
        try {
            // Create a simple job failure log in the database
            // You could extend this with a dedicated JobFailure model
            console.error(`Job Failure Log: ${jobName}`, {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        } catch (logError) {
            console.error('Failed to log job failure:', logError);
        }
    }
}

// Export singleton instance
export const jobScheduler = new JobScheduler();

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await jobScheduler.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await jobScheduler.stop();
    process.exit(0);
});

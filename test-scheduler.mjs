#!/usr/bin/env node
/**
 * Scheduler Test Script
 * Tests the job scheduling system
 */
import { jobScheduler } from './src/lib/scheduler';

async function main() {
    console.log('🚀 Testing Job Scheduler...');

    try {
        // Test job status
        console.log('Initial job status:', jobScheduler.getJobStatus());

        // Start the scheduler
        await jobScheduler.start();

        // Let it run for a bit
        console.log('Scheduler running... Press Ctrl+C to stop');

        // Keep the process alive
        process.stdin.resume();
    } catch (error) {
        console.error('❌ Scheduler test failed:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down scheduler...');
    await jobScheduler.stop();
    process.exit(0);
});

main().catch(console.error);

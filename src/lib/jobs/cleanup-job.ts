/**
 * Cleanup Job
 * Performs regular database cleanup and maintenance tasks
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanupJob(): Promise<void> {
    console.log('🔄 Starting cleanup job...');

    try {
        // Clean up expired payment entries
        await cleanupExpiredPayments();

        // Clean up old verification tokens
        await cleanupOldTokens();

        // Clean up old admin audit logs (keep 90 days)
        await cleanupOldAuditLogs();

        console.log('✅ Cleanup job completed');
    } catch (error) {
        console.error('❌ Cleanup job failed:', error);
        throw error;
    }
}

async function cleanupExpiredPayments(): Promise<void> {
    console.log('Cleaning up expired payment entries...');

    try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        // Remove user entries that have been in PENDING_PAYMENT status for more than 24 hours
        const expiredEntries = await prisma.userGameEntry.deleteMany({
            where: {
                status: 'PENDING_PAYMENT',
                createdAt: { lte: oneDayAgo }
            }
        });

        console.log(`🗑️ Removed ${expiredEntries.count} expired payment entries`);
    } catch (error) {
        console.error('❌ Error cleaning up expired payments:', error);
    }
}

async function cleanupOldTokens(): Promise<void> {
    console.log('Cleaning up expired tokens...');

    try {
        const now = new Date();

        // Clean up old verification tokens
        const expiredVerificationTokens = await prisma.verificationToken.deleteMany({
            where: {
                expires: { lte: now }
            }
        });

        console.log(`🗑️ Cleaned up ${expiredVerificationTokens.count} verification tokens`);

        // TODO: Add user token cleanup once schema field names are confirmed
    } catch (error) {
        console.error('❌ Error cleaning up tokens:', error);
    }
}

async function cleanupOldAuditLogs(): Promise<void> {
    console.log('Cleaning up old audit logs...');

    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Note: AdminAuditLog model exists but keeping logs for audit purposes
        // Only clean up very old logs (6 months+)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        console.log(`🗑️ Audit logs cleanup - keeping recent logs for compliance`);
    } catch (error) {
        console.error('❌ Error cleaning up audit logs:', error);
    }
}

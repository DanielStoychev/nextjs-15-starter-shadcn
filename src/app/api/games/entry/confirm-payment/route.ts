import { NextResponse } from 'next/server';

import { withErrorHandling } from '@/lib/api-utils';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-05-28.basil'
});

// In-memory cache for processed payments (in production, use Redis)
const processedPayments = new Set<string>();

export async function POST(req: Request) {
    return withErrorHandling(async () => {
        console.log('🔄 Payment confirmation started');

        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            throw new Error('Unauthorized');
        }

        const { sessionId } = await req.json();

        if (!sessionId) {
            throw new Error('Session ID is required');
        }

        console.log(`🔍 Confirming payment for session: ${sessionId}`);

        // Retrieve the checkout session from Stripe first
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

        if (!checkoutSession) {
            throw new Error('Invalid session ID');
        }

        console.log(`💳 Stripe session status: ${checkoutSession.payment_status}`);

        // Verify the session belongs to the current user
        if (checkoutSession.metadata?.userId !== session.user.id) {
            throw new Error('Unauthorized access to session');
        }

        // Idempotency check
        const idempotencyKey = `${sessionId}-${session.user.id}`;
        if (processedPayments.has(idempotencyKey)) {
            // Check if user already has entry for this game instance
            const userGameEntryId = checkoutSession.metadata?.userGameEntryId;
            if (userGameEntryId) {
                const existingEntry = await prisma.userGameEntry.findUnique({
                    where: { id: userGameEntryId },
                    include: {
                        gameInstance: {
                            include: {
                                game: true
                            }
                        }
                    }
                });

                if (existingEntry) {
                    return {
                        success: true,
                        entry: existingEntry,
                        message: `Already confirmed: You're entered in ${existingEntry.gameInstance.game.name}`
                    };
                }
            }
        }

        if (!checkoutSession) {
            throw new Error('Invalid session ID');
        }

        // Verify the session belongs to the current user
        if (checkoutSession.metadata?.userId !== session.user.id) {
            throw new Error('Unauthorized access to session');
        }

        // Check if payment was successful
        if (checkoutSession.payment_status !== 'paid') {
            throw new Error(`Payment not completed. Status: ${checkoutSession.payment_status}`);
        }

        const userGameEntryId = checkoutSession.metadata?.userGameEntryId;
        const gameInstanceId = checkoutSession.metadata?.gameInstanceId;

        if (!userGameEntryId || !gameInstanceId) {
            throw new Error('Missing metadata in payment session');
        }

        // Check if user entry already exists and is active (double-check)
        const existingActiveEntry = await prisma.userGameEntry.findFirst({
            where: {
                id: userGameEntryId,
                status: 'ACTIVE'
            }
        });

        if (existingActiveEntry) {
            // Mark as processed and return existing entry
            processedPayments.add(idempotencyKey);

            const entry = await prisma.userGameEntry.findUnique({
                where: { id: userGameEntryId },
                include: {
                    gameInstance: {
                        include: {
                            game: true
                        }
                    }
                }
            });

            return {
                success: true,
                entry,
                message: `Already active: You're entered in ${entry?.gameInstance.game.name}`
            };
        }

        // Update the user game entry status to ACTIVE
        console.log(`✅ Updating entry ${userGameEntryId} to ACTIVE status`);

        const updatedEntry = await prisma.userGameEntry.update({
            where: { id: userGameEntryId },
            data: {
                status: 'ACTIVE'
            },
            include: {
                gameInstance: {
                    include: {
                        game: true
                    }
                }
            }
        });

        console.log(`💰 Creating order record for ${session.user.id}`);

        // Create an order record for tracking
        await prisma.order.create({
            data: {
                userId: session.user.id,
                amount: checkoutSession.amount_total || 0,
                currency: checkoutSession.currency || 'gbp',
                status: 'COMPLETED',
                stripePaymentIntentId: checkoutSession.payment_intent as string
            }
        });

        // Update prize pool (80% of entry fees)
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { id: gameInstanceId },
            include: {
                userEntries: {
                    where: {
                        status: 'ACTIVE'
                    }
                }
            }
        });

        if (gameInstance) {
            const activeEntriesCount = gameInstance.userEntries.length;
            const totalEntryFees = activeEntriesCount * gameInstance.entryFee;
            const newPrizePool = totalEntryFees * 0.8;

            await prisma.gameInstance.update({
                where: { id: gameInstanceId },
                data: { prizePool: newPrizePool }
            });

            console.log(
                `💰 Updated prize pool for ${gameInstance.name}: ${activeEntriesCount} active entries × £${(gameInstance.entryFee / 100).toFixed(2)} × 80% = £${(newPrizePool / 100).toFixed(2)}`
            );
        }

        // Mark as processed
        processedPayments.add(idempotencyKey);

        console.log(
            `🎉 Payment confirmation completed for user ${session.user.id} in game ${updatedEntry.gameInstance.game.name}`
        );

        // Clean up old processed payments (keep last 1000)
        if (processedPayments.size > 1000) {
            const entries = Array.from(processedPayments);
            processedPayments.clear();
            entries.slice(-500).forEach((key) => processedPayments.add(key));
        }

        return {
            success: true,
            entry: updatedEntry,
            message: `Payment successful! You're now entered in ${updatedEntry.gameInstance.game.name}`
        };
    });
}

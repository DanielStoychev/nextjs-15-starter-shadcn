import { NextRequest, NextResponse } from 'next/server';

import { notifyPaymentSuccess } from '@/lib/notification-service';
import prisma from '@/lib/prisma';

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);

        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;

            if (session.metadata?.gameInstanceId && session.metadata?.userId) {
                try {
                    // Update the user's game entry status to PAID
                    // Update the user's game entry status to ACTIVE
                    await prisma.userGameEntry.update({
                        where: {
                            userId_gameInstanceId: {
                                userId: session.metadata.userId,
                                gameInstanceId: session.metadata.gameInstanceId
                            }
                        },
                        data: {
                            status: 'ACTIVE'
                        }
                    });

                    // Get the game instance
                    const gameInstance = await prisma.gameInstance.findUnique({
                        where: {
                            id: session.metadata.gameInstanceId
                        },
                        include: {
                            userEntries: true
                        }
                    });

                    if (gameInstance) {
                        // Calculate the prize pool as 80% of total entry fees
                        const totalEntryFees = gameInstance.entryFee * gameInstance.userEntries.length;
                        const prizePool = Math.floor(totalEntryFees * 0.8); // 80% of total fees

                        // Update the prize pool
                        await prisma.gameInstance.update({
                            where: {
                                id: gameInstance.id
                            },
                            data: {
                                prizePool: prizePool
                            }
                        });
                    }

                    console.log(
                        `Payment successful for user ${session.metadata.userId} in game ${session.metadata.gameInstanceId}. Prize pool updated.`
                    );

                    // Trigger payment success notification
                    await notifyPaymentSuccess(session.metadata.userId, session.metadata.gameInstanceId);
                } catch (error) {
                    console.error('Error updating game entry status:', error);
                    // Don't return error here as we don't want to fail the webhook
                }
            }
            break;
        }

        case 'checkout.session.expired': {
            const expiredSession = event.data.object as Stripe.Checkout.Session;

            if (expiredSession.metadata?.gameInstanceId && expiredSession.metadata?.userId) {
                try {
                    // Update the user's game entry status to EXPIRED or remove it
                    await prisma.userGameEntry.delete({
                        where: {
                            userId_gameInstanceId: {
                                userId: expiredSession.metadata.userId,
                                gameInstanceId: expiredSession.metadata.gameInstanceId
                            }
                        }
                    });

                    console.log(
                        `Payment expired for user ${expiredSession.metadata.userId} in game ${expiredSession.metadata.gameInstanceId}`
                    );
                } catch (error) {
                    console.error('Error handling expired session:', error);
                    // Don't return error here as we don't want to fail the webhook
                }
            }
            break;
        }

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

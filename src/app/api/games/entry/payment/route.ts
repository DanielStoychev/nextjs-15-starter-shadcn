import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-05-28.basil'
});

export async function POST(req: Request) {
    try {
        console.log('💳 Payment session creation started');

        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email || !session.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { gameInstanceId } = await req.json();

        if (!gameInstanceId) {
            return NextResponse.json({ error: 'Game instance ID is required' }, { status: 400 });
        }

        console.log(`🎮 Creating payment for game instance: ${gameInstanceId}`);

        // Get the game instance to get entry fee
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { id: gameInstanceId },
            include: { game: true }
        });

        if (!gameInstance) {
            return NextResponse.json({ error: 'Game instance not found' }, { status: 404 });
        }

        console.log(`💰 Entry fee: £${(gameInstance.entryFee / 100).toFixed(2)}`);

        // Check if user already has an entry for this game
        const existingEntry = await prisma.userGameEntry.findUnique({
            where: {
                userId_gameInstanceId: {
                    userId: session.user.id,
                    gameInstanceId: gameInstanceId
                }
            }
        });

        if (existingEntry && existingEntry.status !== 'PENDING_PAYMENT') {
            return NextResponse.json(
                {
                    error: 'You already have an entry for this game'
                },
                { status: 400 }
            );
        }

        // Ensure user has a Stripe customer ID
        let stripeCustomerId = session.user.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: session.user.email,
                name: session.user.name || session.user.email,
                metadata: {
                    userId: session.user.id
                }
            });
            stripeCustomerId = customer.id;

            await prisma.user.update({
                where: { id: session.user.id },
                data: { stripeCustomerId: customer.id }
            });
        }

        // Create or update the user game entry
        console.log(`📝 Creating/updating user game entry for user ${session.user.id}`);

        const userGameEntry = await prisma.userGameEntry.upsert({
            where: {
                userId_gameInstanceId: {
                    userId: session.user.id,
                    gameInstanceId: gameInstanceId
                }
            },
            update: {
                status: 'PENDING_PAYMENT'
            },
            create: {
                userId: session.user.id,
                gameInstanceId: gameInstanceId,
                status: 'PENDING_PAYMENT'
            }
        });

        console.log(`📝 User game entry ID: ${userGameEntry.id}`);

        // Create Stripe checkout session
        console.log(`🔗 Creating Stripe checkout session`);

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: `${gameInstance.game.name} - ${gameInstance.name}`,
                            description: gameInstance.game.description || `Entry fee for ${gameInstance.name}`
                        },
                        unit_amount: gameInstance.entryFee // Entry fee in pence
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            success_url: `${process.env.NEXTAUTH_URL}/games/${gameInstance.game.slug}/${gameInstance.id}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/games/${gameInstance.game.slug}/${gameInstance.id}?success=false&cancelled=true`,
            metadata: {
                userId: session.user.id,
                gameInstanceId: gameInstanceId,
                userGameEntryId: userGameEntry.id
            }
        });

        console.log(`✅ Stripe session created: ${checkoutSession.id}`);
        console.log(`🔗 Redirect URL: ${checkoutSession.url}`);

        return NextResponse.json({
            sessionId: checkoutSession.id,
            url: checkoutSession.url,
            userGameEntryId: userGameEntry.id
        });
    } catch (error) {
        console.error('Error creating game entry payment:', error);

        return NextResponse.json(
            { error: 'Failed to create payment session', details: (error as Error).message },
            { status: 500 }
        );
    }
}

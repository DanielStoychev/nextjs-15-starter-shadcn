import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-05-28.basil'
});

// Test GET handler to retrieve a price
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const priceId = searchParams.get('price_id');

    if (!priceId) {
        return NextResponse.json({ error: 'Price ID is required in query parameters' }, { status: 400 });
    }
    try {
        console.log(`Attempting to retrieve price: ${priceId}`);
        const price = await stripe.prices.retrieve(priceId);
        console.log('Price retrieved successfully:', price);

        return NextResponse.json({ price });
    } catch (error) {
        console.error('Error retrieving price:', error);

        return NextResponse.json(
            { error: 'Failed to retrieve price', details: (error as Error).message, stripeError: error },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, quantity = 1 } = await req.json();

    if (!priceId) {
        return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    try {
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

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            line_items: [
                {
                    price: priceId,
                    quantity: quantity
                }
            ],
            mode: 'payment',
            success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
            metadata: {
                userId: session.user.id
            }
        });

        return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);

        return NextResponse.json(
            { error: 'Failed to create checkout session', details: (error as Error).message },
            { status: 500 }
        );
    }
}

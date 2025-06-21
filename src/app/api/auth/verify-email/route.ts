import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import {
    checkMemoryRateLimit,
    checkRateLimit,
    emailVerificationLimiter,
    memoryEmailVerificationLimiter
} from '@/lib/rate-limit';

import { z } from 'zod';

const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Token is required')
});

export async function POST(req: Request) {
    try {
        // Check rate limiting first
        if (emailVerificationLimiter) {
            const rateLimitResult = await checkRateLimit(req, emailVerificationLimiter);
            if (rateLimitResult) return rateLimitResult;
        } else {
            // Fallback to memory-based rate limiting
            const rateLimitResult = checkMemoryRateLimit(req, memoryEmailVerificationLimiter);
            if (rateLimitResult) return rateLimitResult;
        }

        const body = await req.json();
        const validatedFields = verifyEmailSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 400 });
        }

        const { token } = validatedFields.data;

        // Find user with this verification token
        const user = await prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: {
                    gt: new Date() // Token must not be expired
                }
            }
        });

        if (!user) {
            return NextResponse.json({ message: 'Invalid or expired verification token' }, { status: 400 });
        }

        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json({ message: 'Email is already verified' }, { status: 200 });
        }

        // Update user to mark email as verified and clear token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                emailVerificationToken: null,
                emailVerificationExpires: null
            }
        });

        return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });
    } catch (error) {
        console.error('[VERIFY_EMAIL_ERROR]', error);

        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

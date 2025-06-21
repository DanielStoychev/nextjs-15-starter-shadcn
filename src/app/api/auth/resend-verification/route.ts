import { NextResponse } from 'next/server';

import { sendVerificationEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import {
    checkMemoryRateLimit,
    checkRateLimit,
    emailVerificationLimiter,
    memoryEmailVerificationLimiter
} from '@/lib/rate-limit';

import crypto from 'crypto';
import { z } from 'zod';

const resendVerificationSchema = z.object({
    email: z.string().email('Invalid email address')
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
        const validatedFields = resendVerificationSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json({ message: 'Invalid email address' }, { status: 400 });
        }

        const { email } = validatedFields.data;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal if user exists for security
            return NextResponse.json(
                { message: "If an account with that email exists, we've sent a verification email." },
                { status: 200 }
            );
        }

        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json({ message: 'Email is already verified' }, { status: 400 });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 3600000); // 24 hours

        // Update user with new verification token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationExpires
            }
        });

        // Send verification email
        await sendVerificationEmail(email, verificationToken, user.name || 'User');

        return NextResponse.json(
            { message: "If an account with that email exists, we've sent a verification email." },
            { status: 200 }
        );
    } catch (error) {
        console.error('[RESEND_VERIFICATION_ERROR]', error);

        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';

import { sendPasswordResetEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import {
    checkMemoryRateLimit,
    checkRateLimit,
    memoryPasswordResetLimiter,
    passwordResetLimiter
} from '@/lib/rate-limit';

import crypto from 'crypto';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address')
});

export async function POST(req: Request) {
    // Check rate limit first
    const rateLimitResponse =
        (await checkRateLimit(req, passwordResetLimiter)) || checkMemoryRateLimit(req, memoryPasswordResetLimiter);

    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    try {
        const body = await req.json();
        const validatedFields = forgotPasswordSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json({ message: 'Invalid email address' }, { status: 400 });
        }

        const { email } = validatedFields.data;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Don't reveal if user exists or not for security
        if (!user) {
            return NextResponse.json(
                { message: "If an account with that email exists, we've sent you a reset link." },
                { status: 200 }
            );
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now    // Update user with reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpires: resetTokenExpires
            }
        });

        // Send password reset email
        await sendPasswordResetEmail(email, resetToken, user.name || 'User');

        return NextResponse.json(
            { message: "If an account with that email exists, we've sent you a reset link." },
            { status: 200 }
        );
    } catch (error) {
        console.error('[FORGOT_PASSWORD_ERROR]', error);

        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

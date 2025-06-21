import { NextResponse } from 'next/server';

import { sendVerificationEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import { checkMemoryRateLimit, checkRateLimit, memoryRegistrationLimiter, registrationLimiter } from '@/lib/rate-limit';

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

export async function POST(req: Request) {
    try {
        // Check rate limiting first
        if (registrationLimiter) {
            const rateLimitResult = await checkRateLimit(req, registrationLimiter);
            if (rateLimitResult) return rateLimitResult;
        } else {
            // Fallback to memory-based rate limiting
            const rateLimitResult = checkMemoryRateLimit(req, memoryRegistrationLimiter);
            if (rateLimitResult) return rateLimitResult;
        }

        const body = await req.json();
        const validatedFields = registerSchema.safeParse(body);

        if (!validatedFields.success) {
            return new NextResponse(JSON.stringify({ errors: validatedFields.error.flatten().fieldErrors }), {
                status: 400
            });
        }

        const { name, email, password } = validatedFields.data;

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return new NextResponse('User with this email already exists', { status: 409 });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 3600000); // 24 hours from now

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                hashedPassword,
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationExpires,
                emailVerified: null // User is not verified initially
            }
        });

        // Send verification email
        await sendVerificationEmail(email, verificationToken, name);

        return NextResponse.json(
            {
                message: 'User registered successfully. Please check your email to verify your account.',
                user: { id: newUser.id, email: newUser.email, name: newUser.name }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('[REGISTER_ERROR]', error);

        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

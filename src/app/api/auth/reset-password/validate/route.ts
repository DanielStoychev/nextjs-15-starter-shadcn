import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

import { z } from 'zod';

const validateTokenSchema = z.object({
    token: z.string().min(1, 'Token is required')
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedFields = validateTokenSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 400 });
        }

        const { token } = validatedFields.data;

        // Find user with this reset token
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpires: {
                    gt: new Date() // Token must not be expired
                }
            }
        });

        if (!user) {
            return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
        }

        return NextResponse.json({ message: 'Token is valid' }, { status: 200 });
    } catch (error) {
        console.error('[VALIDATE_TOKEN_ERROR]', error);

        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

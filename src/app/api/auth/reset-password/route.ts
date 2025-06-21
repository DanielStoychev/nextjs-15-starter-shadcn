import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

import bcrypt from 'bcryptjs';
import { z } from 'zod';

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedFields = resetPasswordSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { message: 'Invalid input', errors: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { token, password } = validatedFields.data;

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

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user with new password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null
            }
        });

        return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('[RESET_PASSWORD_ERROR]', error);

        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

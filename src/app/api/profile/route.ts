import { NextResponse } from 'next/server';

import { withErrorHandling } from '@/lib/api-utils';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';
import { withCSRFProtection, withOwnershipCheck } from '@/lib/security-middleware';

import { getServerSession } from 'next-auth';
import { z } from 'zod';

const FormSchema = z.object({
    name: z.string().min(2, {
        message: 'Name must be at least 2 characters.'
    }),
    email: z
        .string({
            required_error: 'Email is required.'
        })
        .email({ message: 'Invalid email address.' }),
    username: z
        .string()
        .min(2, {
            message: 'Username must be at least 2 characters.'
        })
        .max(30, {
            message: 'Username must not be longer than 30 characters.'
        })
        .optional(),
    bio: z
        .string()
        .max(160, {
            message: 'Bio must not be longer than 160 characters.'
        })
        .min(4, {
            message: 'Bio must be at least 4 characters.'
        })
        .optional(),
    location: z.string().optional(),
    favouriteTeam: z.string().optional()
});

export async function PUT(req: Request) {
    return withErrorHandling(async () => {
        // CSRF Protection
        const origin = req.headers.get('origin');
        const host = req.headers.get('host');

        if (origin) {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
                throw new Error('CSRF: Invalid origin');
            }
        }

        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            throw new Error('Unauthorized');
        }

        const body = await req.json();
        const validatedFields = FormSchema.safeParse(body);

        if (!validatedFields.success) {
            throw new Error(`Invalid fields: ${validatedFields.error.errors.map((e) => e.message).join(', ')}`);
        }

        const { name, email, username, bio, location, favouriteTeam } = validatedFields.data;

        // Check if username is taken by another user
        if (username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username,
                    NOT: { id: session.user.id }
                }
            });

            if (existingUser) {
                throw new Error('Username is already taken');
            }
        }

        // Check if email is taken by another user
        const existingEmailUser = await prisma.user.findFirst({
            where: {
                email,
                NOT: { id: session.user.id }
            }
        });

        if (existingEmailUser) {
            throw new Error('Email is already registered');
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                email,
                username,
                bio,
                location,
                favouriteTeam
            }
        });

        return NextResponse.json(updatedUser);
    });
}

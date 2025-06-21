import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test the User model fields
async function testUserFields() {
    const user = await prisma.user.create({
        data: {
            name: 'test',
            email: 'test@example.com',
            emailVerificationToken: 'test-token',
            emailVerificationExpires: new Date(),
            passwordResetToken: null,
            passwordResetExpires: null
        }
    });

    console.log('User created:', user.id);
}

// This file is just for testing TypeScript compilation
export {};

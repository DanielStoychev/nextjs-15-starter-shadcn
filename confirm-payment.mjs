#!/usr/bin/env node
/**
 * Manual Payment Confirmation Script
 *
 * This script manually updates payment status when webhook isn't working
 * Use this during development to simulate successful webhook processing
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function confirmPayment(userEmail, gameInstanceId) {
    try {
        console.log('🔍 Looking for user and game instance...');

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });
        if (!user) {
            console.log('❌ User not found:', userEmail);

            return;
        }

        console.log('✅ User found:', user.email);

        // Find the game instance
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { id: gameInstanceId },
            include: { game: true }
        });
        if (!gameInstance) {
            console.log('❌ Game instance not found:', gameInstanceId);

            return;
        }

        console.log('✅ Game instance found:', gameInstance.name);

        // Find or create user game entry
        let userEntry = await prisma.userGameEntry.findUnique({
            where: {
                userId_gameInstanceId: {
                    userId: user.id,
                    gameInstanceId: gameInstanceId
                }
            }
        });

        if (!userEntry) {
            console.log('📝 Creating new user game entry...');
            userEntry = await prisma.userGameEntry.create({
                data: {
                    userId: user.id,
                    gameInstanceId: gameInstanceId,
                    status: 'ACTIVE'
                }
            });
            console.log('✅ User game entry created with ACTIVE status');
        } else {
            console.log('📝 Updating existing user game entry...');
            userEntry = await prisma.userGameEntry.update({
                where: {
                    userId_gameInstanceId: {
                        userId: user.id,
                        gameInstanceId: gameInstanceId
                    }
                },
                data: {
                    status: 'ACTIVE'
                }
            });
            console.log('✅ User game entry updated to ACTIVE status');
        }

        console.log('\n🎉 Payment confirmation complete!');
        console.log('📊 Summary:');
        console.log(`   User: ${user.email}`);
        console.log(`   Game: ${gameInstance.name}`);
        console.log(`   Status: ${userEntry.status}`);
        console.log(`   Entry ID: ${userEntry.id}`);
    } catch (error) {
        console.error('❌ Error confirming payment:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Command line usage
if (process.argv.length !== 4) {
    console.log('Usage: node confirm-payment.mjs <user-email> <game-instance-id>');
    console.log('Example: node confirm-payment.mjs payment.test@example.com clzqw1234567890123');
    process.exit(1);
}

const userEmail = process.argv[2];
const gameInstanceId = process.argv[3];

confirmPayment(userEmail, gameInstanceId);

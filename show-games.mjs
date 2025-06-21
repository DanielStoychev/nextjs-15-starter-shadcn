#!/usr/bin/env node
/**
 * Show current game instances for payment testing
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showGames() {
    try {
        console.log('🎮 Available Game Instances:\n');

        const games = await prisma.gameInstance.findMany({
            include: {
                game: true,
                userEntries: {
                    where: {
                        user: {
                            email: 'admin@footygames.co.uk'
                        }
                    }
                }
            },
            where: {
                status: 'ACTIVE'
            }
        });

        games.forEach((instance, index) => {
            const hasEntry = instance.userEntries.length > 0;
            const entryStatus = hasEntry ? instance.userEntries[0].status : 'No Entry';

            console.log(`${index + 1}. ${instance.game.name} - ${instance.name}`);
            console.log(`   ID: ${instance.id}`);
            console.log(`   Entry Fee: £${(instance.entryFee / 100).toFixed(2)}`);
            console.log(`   Your Status: ${entryStatus}`);
            console.log(`   Status: ${hasEntry ? '🔴 Has Entry' : '🟢 Available'}`);
            console.log('');
        });

        console.log('💡 To confirm payment, run:');
        console.log('   node confirm-payment.mjs admin@footygames.co.uk <game-instance-id>');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

showGames();

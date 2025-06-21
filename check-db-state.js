#!/usr/bin/env node
/**
 * Database State Checker - Quick check of database content for testing
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseState() {
    console.log('🔍 Checking Database State for Payment Testing...\n');

    try {
        // Check users
        const userCount = await prisma.user.count();
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                emailVerified: true
            },
            take: 5
        });

        console.log(`👥 Users: ${userCount} total`);
        users.forEach((user) => {
            console.log(
                `   - ${user.email} (${user.username}) - ${user.role} - ${user.emailVerified ? 'Verified' : 'Unverified'}`
            );
        });

        // Check games
        const gameCount = await prisma.game.count();
        const games = await prisma.game.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                    select: {
                        gameInstances: true
                    }
                }
            }
        });

        console.log(`\n🎮 Games: ${gameCount} total`);
        games.forEach((game) => {
            console.log(`   - ${game.name} (${game.slug}) - ${game._count.gameInstances} instances`);
        });

        // Check game instances
        const instanceCount = await prisma.gameInstance.count();
        const instances = await prisma.gameInstance.findMany({
            where: {
                status: {
                    in: ['ACTIVE', 'PENDING']
                }
            },
            select: {
                id: true,
                name: true,
                status: true,
                entryFee: true,
                game: {
                    select: {
                        name: true,
                        slug: true
                    }
                }
            },
            take: 5
        });

        console.log(`\n🎯 Active Game Instances: ${instances.length} of ${instanceCount} total`);
        instances.forEach((instance) => {
            console.log(
                `   - ${instance.game.name}: ${instance.name} - £${(instance.entryFee / 100).toFixed(2)} - ${instance.status}`
            );
            console.log(`     ID: ${instance.id}`);
        });

        // Check user game entries
        const entryCount = await prisma.userGameEntry.count();
        const entries = await prisma.userGameEntry.findMany({
            select: {
                id: true,
                status: true,
                user: {
                    select: {
                        email: true
                    }
                },
                gameInstance: {
                    select: {
                        name: true,
                        game: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            take: 5
        });

        console.log(`\n🎟️  User Game Entries: ${entryCount} total`);
        entries.forEach((entry) => {
            console.log(
                `   - ${entry.user.email} in ${entry.gameInstance.game.name}: ${entry.gameInstance.name} - ${entry.status}`
            );
        });

        console.log('\n✅ Database check complete! Ready for payment testing.');
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabaseState();

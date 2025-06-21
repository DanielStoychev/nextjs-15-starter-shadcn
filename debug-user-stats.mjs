#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUserStats() {
    console.log('🔍 Debugging User Stats API Logic...\n');

    try {
        // Get all users
        const users = await prisma.user.findMany();
        console.log(`Found ${users.length} users`);

        for (const user of users) {
            console.log(`\n📊 User: ${user.email} (ID: ${user.id})`);

            // Get user orders (like the API does)
            const orders = await prisma.order.findMany({
                where: {
                    userId: user.id
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            console.log(`  📦 Orders: ${orders.length}`);
            // Calculate total spent (like the API does)
            const totalSpent = orders.reduce((acc, order) => {
                if (order.status === 'COMPLETED') {
                    console.log(`    ✅ Completed Order: £${(order.amount / 100).toFixed(2)} (${order.amount} pence)`);

                    return acc + (order.amount || 0);
                }
                console.log(`    ❌ Non-completed Order: ${order.status} - £${(order.amount / 100).toFixed(2)}`);

                return acc;
            }, 0);

            console.log(`  💰 Total Spent (raw): ${totalSpent} pence`);
            console.log(`  💰 Total Spent (formatted): £${(totalSpent / 100).toFixed(2)}`);

            // Get user entries
            const userEntries = await prisma.userGameEntry.findMany({
                where: {
                    userId: user.id
                },
                include: {
                    gameInstance: {
                        include: {
                            game: true
                        }
                    }
                }
            });

            console.log(`  🎮 Game Entries: ${userEntries.length}`);

            // Show recent orders with details
            if (orders.length > 0) {
                console.log(`  📋 Recent Orders:`);
                orders.slice(0, 3).forEach((order, index) => {
                    console.log(
                        `    ${index + 1}. ${order.status} - £${(order.amount / 100).toFixed(2)} - ${order.createdAt}`
                    );
                });
            }
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugUserStats();

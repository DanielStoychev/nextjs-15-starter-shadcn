#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCurrentUserInfo() {
    console.log('🔍 Checking user accounts and financial data...\n');

    try {
        // Get all users with their orders
        const users = await prisma.user.findMany({
            include: {
                orders: true,
                userGameEntries: {
                    include: {
                        gameInstance: {
                            include: {
                                game: true
                            }
                        }
                    }
                }
            }
        });

        console.log(`Found ${users.length} users:\n`);
        for (const user of users) {
            const totalSpent = user.orders.reduce((acc, order) => {
                if (order.status === 'COMPLETED') {
                    return acc + (order.amount || 0);
                }

                return acc;
            }, 0);

            console.log(`👤 User: ${user.email}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Name: ${user.name || 'Not set'}`);
            console.log(`   Created: ${user.createdAt}`);
            console.log(`   Orders: ${user.orders.length} (Total: £${(totalSpent / 100).toFixed(2)})`);
            console.log(`   Game Entries: ${user.userGameEntries.length}`);

            if (user.orders.length > 0) {
                console.log(`   📦 Recent Orders:`);
                user.orders.slice(0, 3).forEach((order, index) => {
                    console.log(
                        `      ${index + 1}. ${order.status} - £${(order.amount / 100).toFixed(2)} - ${order.createdAt}`
                    );
                });
            }

            if (user.userGameEntries.length > 0) {
                console.log(`   🎮 Game Entries:`);
                user.userGameEntries.slice(0, 3).forEach((entry, index) => {
                    console.log(`      ${index + 1}. ${entry.gameInstance.game.name} - ${entry.status}`);
                });
            }

            console.log('');
        }

        // Show which users have made payments
        const usersWithPayments = users.filter((u) => u.orders.some((o) => o.status === 'COMPLETED'));

        console.log(`💰 Users who have made payments (${usersWithPayments.length}):`);
        usersWithPayments.forEach((user) => {
            const totalSpent = user.orders.reduce((acc, order) => {
                if (order.status === 'COMPLETED') {
                    return acc + (order.amount || 0);
                }

                return acc;
            }, 0);
            console.log(`   - ${user.email}: £${(totalSpent / 100).toFixed(2)}`);
        });
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getCurrentUserInfo();

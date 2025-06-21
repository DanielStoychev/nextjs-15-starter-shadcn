#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUserStatsAPI() {
    console.log('🔍 Debugging User Stats API for test22@test.com...\n');

    try {
        // Find the test22 user
        const user = await prisma.user.findUnique({
            where: {
                email: 'test22@test.com'
            }
        });
        if (!user) {
            console.log('❌ User test22@test.com not found');

            return;
        }

        console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`);

        // Replicate the exact logic from the API route
        console.log('📊 Replicating API logic...\n');

        // 1. Get user entries (like the API does)
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

        console.log(`🎮 User Entries: ${userEntries.length}`);
        userEntries.forEach((entry, index) => {
            console.log(`   ${index + 1}. ${entry.gameInstance.game.name} - Status: ${entry.status}`);
        });

        // 2. Get order history (like the API does)
        const orders = await prisma.order.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`\n📦 Orders: ${orders.length}`);
        orders.forEach((order, index) => {
            console.log(
                `   ${index + 1}. Status: ${order.status}, Amount: ${order.amount} pence (£${(order.amount / 100).toFixed(2)})`
            );
        });

        // 3. Calculate total spent (EXACT same logic as API)
        console.log(`\n💰 Calculating total spent...`);

        const totalSpent = orders.reduce((acc, order) => {
            console.log(`   Processing order: status=${order.status}, amount=${order.amount}`);
            if (order.status === 'COMPLETED') {
                console.log(`   ✅ Adding ${order.amount} to total (was ${acc})`);

                return acc + (order.amount || 0);
            }

            console.log(`   ❌ Skipping order with status: ${order.status}`);

            return acc;
        }, 0);

        console.log(`\n🔢 Raw total spent: ${totalSpent} pence`);
        console.log(`💷 Formatted total spent: £${(totalSpent / 100).toFixed(2)}`);

        // 4. Test the exact return value from API
        const apiResult = {
            totalSpent: Number((totalSpent / 100).toFixed(2)) || 0
        };

        console.log(`\n📋 API would return:`);
        console.log(`   totalSpent: ${apiResult.totalSpent}`);
        console.log(`   Type: ${typeof apiResult.totalSpent}`);

        // 5. Test potential issues
        console.log(`\n🔍 Debugging potential issues:`);
        console.log(`   - User ID from DB: ${user.id}`);
        console.log(`   - Orders count: ${orders.length}`);
        console.log(`   - Completed orders: ${orders.filter((o) => o.status === 'COMPLETED').length}`);
        console.log(`   - Total amount sum: ${orders.reduce((sum, o) => sum + (o.amount || 0), 0)} pence`);
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugUserStatsAPI();

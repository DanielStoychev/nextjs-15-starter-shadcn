import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUserFinancials() {
    try {
        console.log('🔍 Debugging User Financial Data...');

        // Get all users to see who has made orders
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        console.log('\n👥 Users in system:');
        users.forEach((user) => {
            console.log(`- ${user.name || user.email} (ID: ${user.id})`);
        });

        // Get all orders
        const orders = await prisma.order.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log('\n💰 Orders in database:');
        if (orders.length === 0) {
            console.log('No orders found!');
        } else {
            orders.forEach((order) => {
                console.log(
                    `- ${order.user.name || order.user.email}: £${(order.amount / 100).toFixed(2)} (Status: ${order.status}) - ${order.createdAt}`
                );
            });
        }

        // Get all user game entries to see payment status
        const userEntries = await prisma.userGameEntry.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                gameInstance: {
                    include: {
                        game: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log('\n🎮 User Game Entries:');
        if (userEntries.length === 0) {
            console.log('No user game entries found!');
        } else {
            userEntries.forEach((entry) => {
                console.log(
                    `- ${entry.user.name || entry.user.email}: ${entry.gameInstance.game.name} (Status: ${entry.status}) - Entry Fee: £${(entry.gameInstance.entryFee / 100).toFixed(2)}`
                );
            });
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugUserFinancials();

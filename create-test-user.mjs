import { PrismaClient } from '@prisma/client';

import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createPaymentTestUser() {
    console.log('👤 Creating Payment Test User...\n');

    try {
        // Create a test user specifically for payment testing
        const hashedPassword = await bcrypt.hash('PaymentTest123!', 12);

        const testUser = await prisma.user.create({
            data: {
                email: 'payment-test@footygames.co.uk',
                username: 'payment-tester',
                hashedPassword: hashedPassword,
                role: 'USER',
                emailVerified: new Date(), // Pre-verify for testing
                name: 'Payment Test User',
                bio: 'Test user for payment integration testing'
            }
        });

        console.log('✅ Payment test user created:');
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Username: ${testUser.username}`);
        console.log(`   Password: PaymentTest123!`);
        console.log(`   ID: ${testUser.id}`);
        console.log(`   Role: ${testUser.role}`);
        console.log(`   Email Verified: ${testUser.emailVerified ? 'Yes' : 'No'}`);

        console.log('\n🎮 Available Games for Testing:');

        const games = await prisma.gameInstance.findMany({
            where: {
                status: {
                    in: ['ACTIVE', 'PENDING']
                }
            },
            include: {
                game: true
            },
            orderBy: {
                entryFee: 'asc'
            }
        });

        games.forEach((instance, index) => {
            console.log(`   ${index + 1}. ${instance.game.name}: ${instance.name}`);
            console.log(`      Entry Fee: £${(instance.entryFee / 100).toFixed(2)}`);
            console.log(`      Status: ${instance.status}`);
            console.log(`      ID: ${instance.id}`);
            console.log(`      URL: http://localhost:3001/games/${instance.game.slug}/${instance.id}`);
            console.log('');
        });

        console.log('🧪 Test Instructions:');
        console.log('1. Navigate to http://localhost:3001/auth/signin');
        console.log('2. Sign in with email: payment-test@footygames.co.uk');
        console.log('3. Password: PaymentTest123!');
        console.log('4. Go to any game URL listed above');
        console.log('5. Click "Pay & Play" button');
        console.log('6. Use Stripe test card: 4242424242424242');
        console.log('7. Verify payment flow and status updates');
    } catch (error) {
        if (error.code === 'P2002') {
            console.log('ℹ️  Payment test user already exists. Using existing user.');

            const existingUser = await prisma.user.findUnique({
                where: { email: 'payment-test@footygames.co.uk' }
            });

            console.log(`   ID: ${existingUser.id}`);
            console.log('   Password: PaymentTest123!');
        } else {
            console.error('❌ Error creating test user:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

createPaymentTestUser();

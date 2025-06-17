import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const rounds = await prisma.round.findMany();
        console.log('Rounds in database:', rounds);

        const dummyRound = await prisma.round.findUnique({
            where: { sportMonksId: 123456789 }
        });
        console.log('Dummy Round (sportMonksId 123456789):', dummyRound);

        const lmsInstance = await prisma.gameInstance.findUnique({
            where: { id: 'lms-aug-2025' }
        });
        console.log('LMS Instance (lms-aug-2025):', lmsInstance);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

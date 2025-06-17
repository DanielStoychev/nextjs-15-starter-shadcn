"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../src/generated/prisma");
const prisma = new prisma_1.PrismaClient();
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
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();

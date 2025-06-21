import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getGameInstances() {
    try {
        const gameInstances = await prisma.gameInstance.findMany({
            include: {
                game: true
            }
        });

        console.log('Game Instances:');
        gameInstances.forEach((instance) => {
            console.log(`- ${instance.game.name} (${instance.game.slug}): ${instance.name} - ID: ${instance.id}`);
            console.log(`  URL: /games/${instance.game.slug}/${instance.id}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getGameInstances();
